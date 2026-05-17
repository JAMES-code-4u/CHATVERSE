import React, { useEffect, useRef, useState, useCallback } from "react";
import SimplePeer from "simple-peer";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const API = process.env.REACT_APP_SERVER_URL || (process.env.NODE_ENV === "production" ? "" : "http://localhost:5000");

// ── Participant Tile ─────────────────────────────────────────────────────────
function ParticipantTile({ peerId, peerName, peerAvatar, stream, isSelf, muted: forceMuted }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initial = peerName?.[0]?.toUpperCase() || "?";

  return (
    <div className="relative rounded-2xl overflow-hidden bg-[#0d0e14] flex items-center justify-center"
      style={{ minHeight: 160, border: "1px solid rgba(108,92,231,0.2)" }}>
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={isSelf || forceMuted}
          className="w-full h-full object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
          style={{ background: "linear-gradient(135deg,#6C5CE7,#a29bfe)" }}>
          {peerAvatar
            ? <img src={peerAvatar.startsWith("http") ? peerAvatar : API + peerAvatar} alt={peerName} className="w-full h-full object-cover rounded-2xl" />
            : initial}
        </div>
      )}

      {/* Name tag */}
      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}>
        {isSelf ? "You" : peerName}
      </div>

      {/* Muted indicator */}
      {forceMuted && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[13px]">mic_off</span>
        </div>
      )}
    </div>
  );
}

// ── Main GroupCallModal ───────────────────────────────────────────────────────
export default function GroupCallModal({ groupId, groupName, callType, onEnd, contacts, currentUser, isIncoming = false, incomingData = null }) {
  const { socket } = useSocket();
  const { token } = useAuth();

  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({}); // peerId -> { peer, stream, name, avatar }
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callDurationRef = useRef(0);
  const [isRecording, setIsRecording] = useState(false);
  const [callJoined, setCallJoined] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const timerRef = useRef(null);
  const screenStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const isVideo = callType === "video";

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Get contact info by userId ──
  const getContactInfo = useCallback(pid => {
    const c = contacts?.find(c => c._id === pid);
    return { name: c?.username || "Unknown", avatar: c?.avatar || null };
  }, [contacts]);

  // ── Create a peer connection to another participant ──
  const createPeer = useCallback((targetUserId, initiator, stream) => {
    if (peersRef.current[targetUserId]) {
      peersRef.current[targetUserId].destroy();
    }

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      },
    });

    peer.on("signal", signal => {
      socket?.emit("groupCallSignal", { groupId, targetUserId, signal });
    });

    peer.on("stream", remoteStream => {
      peersRef.current[targetUserId] = { ...peersRef.current[targetUserId], stream: remoteStream };
      const info = getContactInfo(targetUserId);
      setPeers(prev => ({
        ...prev,
        [targetUserId]: { ...prev[targetUserId], stream: remoteStream, name: info.name, avatar: info.avatar },
      }));
    });

    peer.on("error", () => peer.destroy());
    peer.on("close", () => {
      delete peersRef.current[targetUserId];
      setPeers(prev => { const n = { ...prev }; delete n[targetUserId]; return n; });
    });

    peersRef.current[targetUserId] = { peer, stream: null, ...getContactInfo(targetUserId) };
    const info = getContactInfo(targetUserId);
    setPeers(prev => ({ ...prev, [targetUserId]: { peer, stream: null, name: info.name, avatar: info.avatar } }));

    return peer;
  }, [getContactInfo, groupId, socket]);

  // ── Start media and join the call ──
  const joinCall = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      setLocalStream(s);
      localStreamRef.current = s;
      setCallJoined(true);

      // Tell server we joined
      socket?.emit("joinGroupCall", { groupId });

      timerRef.current = setInterval(() => {
        setCallDuration(d => { callDurationRef.current = d + 1; return d + 1; });
      }, 1000);
    } catch (err) {
      console.error("Media error:", err);
      alert("Could not access camera/microphone. Please check permissions.");
      onEnd();
    }
  }, [groupId, isVideo, onEnd, socket]);

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    Object.values(peersRef.current).forEach(p => p?.peer?.destroy?.());
    peersRef.current = {};
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
  }, []);

  // ── Start call (initiator) ──
  useEffect(() => {
    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
        setLocalStream(s);
        localStreamRef.current = s;
        setCallJoined(true);

        if (!isIncoming) {
          socket?.emit("startGroupCall", { groupId, callType, groupName });
          socket?.emit("joinGroupCall", { groupId });
        }

        timerRef.current = setInterval(() => {
          setCallDuration(d => { callDurationRef.current = d + 1; return d + 1; });
        }, 1000);
      } catch (err) {
        console.error("Media error:", err);
        alert("Could not access camera/microphone.");
        onEnd();
      }
    };

    if (!isIncoming) init();
    return cleanup;
  }, []); // eslint-disable-line

  // ── Socket event listeners ──
  useEffect(() => {
    if (!socket) return;

    // Server tells us who's already in the call
    const onCurrentParticipants = ({ participants }) => {
      const stream = localStreamRef.current;
      if (!stream) return;
      participants.forEach(pid => {
        // We are the newcomer, so we initiate connection to existing members
        const peer = createPeer(pid, true, stream); 
        peersRef.current[pid] = { ...peersRef.current[pid], peer };
      });
    };

    // A new peer just joined → existing members receive this
    const onPeerJoined = ({ newPeerId, newPeerName, newPeerAvatar }) => {
      const stream = localStreamRef.current;
      if (!stream || !callJoined) return;
      
      // We are an existing member. We wait for the newcomer to initiate.
      // Create a peer with initiator: false to prepare for incoming signal.
      const peer = createPeer(newPeerId, false, stream);
      peersRef.current[newPeerId] = { ...peersRef.current[newPeerId], peer };

      // Add placeholder entry in UI
      setPeers(prev => prev[newPeerId] ? prev : {
        ...prev,
        [newPeerId]: { stream: null, name: newPeerName, avatar: newPeerAvatar },
      });
    };

    // Incoming WebRTC signal from another peer
    const onGroupCallSignal = ({ fromUserId, signal }) => {
      const stream = localStreamRef.current;
      if (!stream) return;

      if (peersRef.current[fromUserId]?.peer) {
        peersRef.current[fromUserId].peer.signal(signal);
      } else {
        // Fallback: if we didn't create the peer yet, create as non-initiator
        const peer = createPeer(fromUserId, false, stream);
        peersRef.current[fromUserId] = { ...peersRef.current[fromUserId], peer };
        peer.signal(signal);
      }
    };

    const onPeerLeft = ({ peerId }) => {
      peersRef.current[peerId]?.peer?.destroy?.();
      delete peersRef.current[peerId];
      setPeers(prev => { const n = { ...prev }; delete n[peerId]; return n; });
    };

    const onCallEnded = () => { cleanup(); onEnd(); };

    socket.on("groupCallCurrentParticipants", onCurrentParticipants);
    socket.on("groupCallPeerJoined", onPeerJoined);
    socket.on("groupCallSignal", onGroupCallSignal);
    socket.on("groupCallPeerLeft", onPeerLeft);
    socket.on("groupCallEnded", onCallEnded);

    return () => {
      socket.off("groupCallCurrentParticipants", onCurrentParticipants);
      socket.off("groupCallPeerJoined", onPeerJoined);
      socket.off("groupCallSignal", onGroupCallSignal);
      socket.off("groupCallPeerLeft", onPeerLeft);
      socket.off("groupCallEnded", onCallEnded);
    };
  }, [socket, callJoined, cleanup, createPeer, onEnd]);

  // ── Controls ──
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
    setMuted(m => !m);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
    setCamOff(c => !c);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      const camStream = localStreamRef.current;
      const camTrack = camStream?.getVideoTracks()[0];
      if (camTrack) {
        Object.values(peersRef.current).forEach(({ peer }) => {
          peer?.replaceTrack?.(peer._senderMap?.get(peer._streams?.[0]?.getVideoTracks()?.[0]), camTrack, camStream);
        });
      }
      setScreenSharing(false);
      return;
    }
    try {
      const sStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = sStream;
      const screenTrack = sStream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(({ peer }) => {
        if (peer?.streams?.[0]) {
          const oldTrack = peer.streams[0].getVideoTracks()[0];
          if (oldTrack) peer.replaceTrack?.(oldTrack, screenTrack, peer.streams[0]);
        }
      });
      sStream.getVideoTracks()[0].onended = () => setScreenSharing(false);
      setScreenSharing(true);
    } catch { /* user cancelled */ }
  };

  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = actx.createMediaStreamDestination();
      if (localStreamRef.current?.getAudioTracks().length > 0) {
        actx.createMediaStreamSource(new MediaStream([localStreamRef.current.getAudioTracks()[0]])).connect(dest);
      }
      Object.values(peersRef.current).forEach(p => {
        if (p?.stream?.getAudioTracks()?.length > 0) {
          actx.createMediaStreamSource(new MediaStream([p.stream.getAudioTracks()[0]])).connect(dest);
        }
      });

      const tracks = [dest.stream.getAudioTracks()[0]];
      const videoTrack = screenStreamRef.current?.getVideoTracks()[0] || localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack && isVideo) {
        tracks.push(videoTrack);
      }
      const combinedStream = new MediaStream(tracks.filter(Boolean));

      let mr;
      try {
        mr = new MediaRecorder(combinedStream, { mimeType: isVideo ? "video/webm; codecs=vp8,opus" : "audio/webm" });
      } catch (e) {
        try {
          mr = new MediaRecorder(combinedStream, { mimeType: isVideo ? "video/webm" : "audio/webm" });
        } catch (e2) {
          mr = new MediaRecorder(combinedStream);
        }
      }

      chunksRef.current = [];
      mr.ondataavailable = e => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: isVideo ? "video/webm" : "audio/webm" });
        
        const formData = new FormData();
        formData.append("recording", blob, `group_recording_${Date.now()}.webm`);
        formData.append("callType", isVideo ? "video" : "voice");
        formData.append("contactName", groupName || "Group Call");
        formData.append("duration", fmt(callDurationRef.current));

        fetch(`${API}/api/recordings/save`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }).catch(err => console.error("Upload group recording error:", err));

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `group-call-${groupName || "recording"}-${Date.now()}.webm`; a.click();
        URL.revokeObjectURL(url);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Recording not supported or failed in this browser.");
    }
  };

  const endCall = () => {
    socket?.emit("leaveGroupCall", { groupId });
    cleanup();
    onEnd();
  };

  // ── Incoming call waiting state ──
  if (isIncoming && !callJoined) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="flex flex-col items-center gap-6 p-10 rounded-3xl"
          style={{ background: "linear-gradient(135deg,#0d0e14,#1a1b23)", border: "1px solid rgba(108,92,231,0.3)", maxWidth: 380, width: "90%" }}>

          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#6C5CE7,#a29bfe)", boxShadow: "0 0 40px rgba(108,92,231,0.5)" }}>
            <span className="material-symbols-outlined text-white text-4xl">
              {callType === "video" ? "videocam" : "call"}
            </span>
          </div>

          <div className="text-center">
            <p className="text-white/50 text-xs font-mono uppercase tracking-widest mb-1">Incoming Group {callType === "video" ? "Video" : "Voice"} Call</p>
            <h2 className="text-white font-black text-xl mb-1">{groupName}</h2>
            <p className="text-white/40 text-sm">{incomingData?.initiatorName} started a call</p>
          </div>

          <div className="flex gap-4">
            <button onClick={endCall}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg,#ef4444,#ff6b6b)", boxShadow: "0 4px 20px rgba(239,68,68,0.5)" }}>
              <span className="material-symbols-outlined text-white text-2xl">call_end</span>
            </button>
            <button onClick={joinCall}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 4px 20px rgba(34,197,94,0.5)" }}>
              <span className="material-symbols-outlined text-white text-2xl">
                {callType === "video" ? "videocam" : "call"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allParticipants = Object.entries(peers);
  const totalCount = allParticipants.length + 1; // +1 for self

  // Responsive grid: 1=solo, 2=side-by-side, 3-4=2x2, 5-6=3x2
  const gridCols = totalCount === 1 ? 1 : totalCount <= 2 ? 2 : totalCount <= 4 ? 2 : 3;

  const controlBtn = (onClick, icon, active, danger = false, pulse = false) => (
    <button onClick={onClick}
      className="relative flex flex-col items-center gap-1.5 group"
      style={{ minWidth: 52 }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 active:scale-95"
        style={{
          background: danger ? (active ? "rgba(239,68,68,0.9)" : "rgba(239,68,68,0.2)")
            : active ? "rgba(108,92,231,0.9)" : "rgba(255,255,255,0.08)",
          boxShadow: active && !danger ? "0 4px 16px rgba(108,92,231,0.4)" : active && danger ? "0 4px 16px rgba(239,68,68,0.4)" : "none",
        }}>
        <span className="material-symbols-outlined text-white text-[20px]">{icon}</span>
        {pulse && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-[#0d0e14]" />}
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col"
      style={{ background: "#0d0e14" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div>
          <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">
            Group {callType === "video" ? "Video" : "Voice"} Call
          </p>
          <h2 className="text-white font-bold text-sm">{groupName}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-mono text-xs">{fmt(callDuration)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer transition-colors hover:bg-white/5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={() => setShowParticipants(p => !p)}>
            <span className="material-symbols-outlined text-white/50 text-sm">group</span>
            <span className="text-white/50 font-mono text-xs">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* ── Video grid ── */}
      <div className="flex-1 overflow-auto p-4"
        style={{ display: "grid", gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: 12, alignContent: "start" }}>

        {/* Local (self) tile */}
        <ParticipantTile
          peerId={currentUser?._id}
          peerName={currentUser?.username}
          peerAvatar={currentUser?.avatar}
          stream={localStream}
          isSelf={true}
          muted={muted}
        />

        {/* Remote peers */}
        {allParticipants.map(([pid, info]) => (
          <ParticipantTile
            key={pid}
            peerId={pid}
            peerName={info.name}
            peerAvatar={info.avatar}
            stream={info.stream}
            isSelf={false}
            muted={false}
          />
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="shrink-0 pb-safe"
        style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-center gap-3 px-6 py-5 flex-wrap">
          {controlBtn(toggleMute, muted ? "mic_off" : "mic", muted, false)}
          {isVideo && controlBtn(toggleCam, camOff ? "videocam_off" : "videocam", camOff, false)}
          {controlBtn(toggleScreenShare, screenSharing ? "stop_screen_share" : "present_to_all", screenSharing, false)}
          {controlBtn(toggleRecording, "fiber_manual_record", isRecording, false, isRecording)}

          {/* End call */}
          <button onClick={endCall}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 mx-2"
            style={{ background: "linear-gradient(135deg,#ef4444,#ff6b6b)", boxShadow: "0 4px 20px rgba(239,68,68,0.5)" }}>
            <span className="material-symbols-outlined text-white text-2xl">call_end</span>
          </button>
        </div>

        {/* Status labels */}
        <div className="flex justify-center gap-6 pb-4">
          {[
            { label: muted ? "Unmute" : "Mute" },
            isVideo ? { label: camOff ? "Camera On" : "Camera Off" } : null,
            { label: screenSharing ? "Stop Share" : "Share Screen" },
            { label: isRecording ? "Stop Rec" : "Record" },
          ].filter(Boolean).map((item, i) => (
            <span key={i} className="text-[10px] font-mono text-white/25 text-center" style={{ minWidth: 52 }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Participants sidebar (optional) ── */}
      {showParticipants && (
        <div className="fixed top-20 right-4 w-56 rounded-2xl p-4 z-10"
          style={{ background: "rgba(26,27,35,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest mb-3">Participants ({totalCount})</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#6C5CE7]/30 flex items-center justify-center text-xs text-white font-bold">
                {currentUser?.username?.[0]?.toUpperCase()}
              </div>
              <span className="text-white/70 text-xs">You</span>
              {muted && <span className="material-symbols-outlined text-red-400 text-[14px] ml-auto">mic_off</span>}
            </div>
            {allParticipants.map(([pid, info]) => (
              <div key={pid} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#6C5CE7]/20 flex items-center justify-center text-xs text-white font-bold overflow-hidden">
                  {info.avatar
                    ? <img src={info.avatar.startsWith("http") ? info.avatar : API + info.avatar} alt={info.name} className="w-full h-full object-cover" />
                    : info.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-white/70 text-xs truncate">{info.name}</span>
                {!info.stream && <span className="text-white/20 text-[10px] ml-auto font-mono">connecting</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
