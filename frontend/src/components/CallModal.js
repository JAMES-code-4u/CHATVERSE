import React, { useEffect, useRef, useState, useCallback } from "react";
import SimplePeer from "simple-peer";
import { useSocket } from "../context/SocketContext";

export default function CallModal({ callData, onEnd, isIncoming = false, localStream: existingStream }) {
  const { socket } = useSocket();
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  const peerRef = useRef(null);
  const screenStreamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);

  const isVideo = callData?.callType === "video";

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    peerRef.current?.destroy();
    stream?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, [stream]);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: isVideo,
          audio: true,
        });
        setStream(s);
        if (localVideoRef.current) localVideoRef.current.srcObject = s;

        if (!isIncoming) {
          // Caller: initiate peer
          const p = new SimplePeer({ initiator: true, trickle: false, stream: s });
          p.on("signal", (signal) => {
            socket?.emit("callUser", {
              userToCall: callData.userId,
              signalData: signal,
              from: callData.myId,
              callType: callData.callType,
            });
          });
          p.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          });
          peerRef.current = p;
          setPeer(p);
        }
      } catch (err) {
        console.error("Media error:", err);
        alert("Could not access camera/microphone. Please check permissions.");
        onEnd();
      }
    };
    getMedia();

    return cleanup;
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!socket) return;

    socket.on("callAccepted", ({ signal }) => {
      peerRef.current?.signal(signal);
      setCallActive(true);
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    });

    socket.on("iceCandidate", ({ candidate }) => {
      peerRef.current?.signal(candidate);
    });

    socket.on("callEnded", () => {
      cleanup();
      onEnd();
    });

    socket.on("callRejected", () => {
      cleanup();
      onEnd();
    });

    // If incoming, answer the call
    if (isIncoming && stream) {
      const p = new SimplePeer({ initiator: false, trickle: false, stream });
      p.on("signal", (signal) => {
        socket.emit("answerCall", { to: callData.from, signal });
      });
      p.on("stream", (remoteStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      });
      p.signal(callData.signal);
      peerRef.current = p;
      setPeer(p);
      setCallActive(true);
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }

    return () => {
      socket.off("callAccepted");
      socket.off("iceCandidate");
      socket.off("callEnded");
      socket.off("callRejected");
    };
  }, [socket, stream]); // eslint-disable-line

  const endCall = () => {
    socket?.emit("endCall", { to: isIncoming ? callData.from : callData.userId });
    cleanup();
    onEnd();
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setMuted(!muted);
    }
  };

  const toggleCam = () => {
    if (stream) {
      stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setCamOff(!camOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        // Replace video track in peer
        const sender = peerRef.current?._pc?.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = () => stopScreenShare();
        setScreenSharing(true);
        socket?.emit("screenShare", { to: isIncoming ? callData.from : callData.userId, sharing: true });
      } catch (err) {
        console.error("Screen share error:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    const camTrack = stream?.getVideoTracks()[0];
    const sender = peerRef.current?._pc?.getSenders().find((s) => s.track?.kind === "video");
    if (sender && camTrack) sender.replaceTrack(camTrack);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    setScreenSharing(false);
    socket?.emit("screenShare", { to: isIncoming ? callData.from : callData.userId, sharing: false });
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }
    const remoteStream = remoteVideoRef.current?.srcObject;
    if (!remoteStream && !stream) return;
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = actx.createMediaStreamDestination();
      if (stream && stream.getAudioTracks().length > 0) {
        actx.createMediaStreamSource(new MediaStream([stream.getAudioTracks()[0]])).connect(dest);
      }
      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        actx.createMediaStreamSource(new MediaStream([remoteStream.getAudioTracks()[0]])).connect(dest);
      }
      const recorder = new MediaRecorder(dest.stream);
      const chunks = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `recording_${callData?.name || "call"}_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Failed to start voice recording.");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur flex items-center justify-center fade-in">
      <div className="relative w-full max-w-3xl mx-4 rounded-3xl overflow-hidden bg-[#1a1b23] shadow-2xl">
        {/* Remote Video / Voice UI */}
        <div className="relative aspect-video bg-[#0d0e14] flex items-center justify-center">
          {isVideo ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-primary">person</span>
              </div>
              <p className="text-white font-semibold text-lg">{callData?.name || "Voice Call"}</p>
              <p className="text-white/50 text-sm">
                {callActive ? formatDuration(callDuration) : "Connecting..."}
              </p>
            </div>
          )}

          {/* Duration badge */}
          {isVideo && callActive && (
            <div className="absolute top-4 left-4 bg-black/50 text-white text-xs font-mono px-3 py-1 rounded-full backdrop-blur">
              {formatDuration(callDuration)}
            </div>
          )}

          {/* Screen sharing badge */}
          {screenSharing && (
            <div className="absolute top-4 right-4 bg-primary/80 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <span className="material-symbols-outlined text-xs">screen_share</span>
              Sharing Screen
            </div>
          )}

          {/* Recording badge */}
          {isRecording && (
            <div className={`absolute ${screenSharing ? "top-14" : "top-4"} right-4 bg-red-500/80 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse`}>
              <span className="w-2 h-2 bg-white rounded-full animate-ping" />
              Recording
            </div>
          )}

          {/* Local Video PiP */}
          {isVideo && (
            <div className="absolute bottom-4 right-4 w-32 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-xl">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 py-5 bg-[#1a1b23]">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${muted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
            title={muted ? "Unmute" : "Mute"}
          >
            <span className="material-symbols-outlined text-xl">{muted ? "mic_off" : "mic"}</span>
          </button>

          {isVideo && (
            <button
              onClick={toggleCam}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${camOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              title={camOff ? "Turn on camera" : "Turn off camera"}
            >
              <span className="material-symbols-outlined text-xl">{camOff ? "videocam_off" : "videocam"}</span>
            </button>
          )}

          {isVideo && (
            <button
              onClick={toggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${screenSharing ? "bg-primary text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              title={screenSharing ? "Stop sharing" : "Share screen"}
            >
              <span className="material-symbols-outlined text-xl">{screenSharing ? "stop_screen_share" : "screen_share"}</span>
            </button>
          )}

          {/* Record Voice Button */}
          <button
            onClick={toggleRecording}
            disabled={!callActive}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-40 ${isRecording ? "bg-red-500 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-[#1a1b23] animate-pulse" : "bg-white/10 text-white hover:bg-white/20"}`}
            title={isRecording ? "Stop recording" : "Record voice conversation"}
          >
            <span className="material-symbols-outlined text-xl">{isRecording ? "stop_circle" : "radio_button_checked"}</span>
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all hover:scale-105"
            title="End call"
          >
            <span className="material-symbols-outlined text-xl">call_end</span>
          </button>
        </div>
      </div>
    </div>
  );
}