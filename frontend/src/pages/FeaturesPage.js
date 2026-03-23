import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function StarField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
      speed: 0.003 + Math.random() * 0.01,
    }));
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00000f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.a = Math.abs(Math.sin(Date.now() * s.speed));
        ctx.globalAlpha = s.a * 0.8 + 0.1;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}

const FEATURES = [
  {
    id: 1,
    tag: "COMMUNICATION",
    title: "Real-Time Messaging",
    desc: "Zero-latency text, voice, and file sharing. Send images, videos, documents, and voice messages with waveform playback.",
    accent: "#00d4ff",
    icon: "chat_bubble",
    mockup: <ChatMockup />,
  },
  {
    id: 2,
    tag: "REACTIONS & REPLIES",
    title: "Message Reactions & Reply-to",
    desc: "React to any message with emoji reactions. Hover a message to reply directly — the quoted message appears for both sender and receiver.",
    accent: "#6C5CE7",
    icon: "add_reaction",
    mockup: <ReactionMockup />,
  },
  {
    id: 3,
    tag: "AI INTEGRATION",
    title: "ChatVerse AI Assistant",
    desc: "Powered by Claude. Draft messages, translate text, summarize conversations, or just have an intelligent chat. Always online, always ready.",
    accent: "#a29bfe",
    icon: "smart_toy",
    mockup: <AIMockup />,
  },
  {
    id: 4,
    tag: "VOICE MESSAGES",
    title: "Animated Voice Waveform",
    desc: "Record and play voice messages with a live animated waveform visualizer. 28-bar visual equalizer animates in real time as audio plays.",
    accent: "#55efc4",
    icon: "graphic_eq",
    mockup: <WaveformMockup />,
  },
  {
    id: 5,
    tag: "VIDEO & VOICE CALLS",
    title: "WebRTC HD Calls",
    desc: "Real peer-to-peer video and voice calls with screen sharing, picture-in-picture local preview, mute/camera controls, and live call duration.",
    accent: "#fdcb6e",
    icon: "videocam",
    mockup: <CallMockup />,
  },
  {
    id: 6,
    tag: "STICKERS & EMOJI",
    title: "Animated Sticker Pack",
    desc: "18 animated stickers including cats, pandas, rockets, butterflies and more — each with a spring pop-in animation. Plus a full emoji picker.",
    accent: "#fd79a8",
    icon: "emoji_emotions",
    mockup: <StickerMockup />,
  },
  {
    id: 7,
    tag: "GROUP CHATS",
    title: "Group Conversations",
    desc: "Create named group chats, add multiple members, and chat together. Group badge distinguishes from 1-on-1 conversations at a glance.",
    accent: "#74b9ff",
    icon: "group",
    mockup: <GroupMockup />,
  },
  {
    id: 8,
    tag: "PRIVACY & APPEARANCE",
    title: "Full Settings Suite",
    desc: "Dark/light theme, accent colors, font sizes, compact mode, read receipts, typing indicators, online status — every detail is yours to control.",
    accent: "#e17055",
    icon: "settings",
    mockup: <SettingsMockup />,
  },
];

// ── Mockup components ─────────────────────────────────────────────────────────
function ChatMockup() {
  return (
    <div className="p-4 space-y-3">
      {[
        { text: "Hey! Did you see the new feature drop? 🚀", sent: false },
        { text: "Yes!! The waveform player looks amazing 🎵", sent: true },
        { text: "Totally. Also the AI assistant is wild", sent: false },
      ].map((m, i) => (
        <div key={i} className={`flex ${m.sent ? "justify-end" : "justify-start"}`}>
          <div className="px-3 py-2 rounded-2xl text-xs max-w-[75%]"
            style={{
              background: m.sent ? "linear-gradient(135deg,#6C5CE7,#a29bfe)" : "rgba(255,255,255,0.08)",
              color: "#fff",
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
            }}>{m.text}</div>
        </div>
      ))}
    </div>
  );
}

function ReactionMockup() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-start">
        <div>
          <div className="px-3 py-2 rounded-2xl text-xs" style={{ background: "rgba(255,255,255,0.08)", color: "#fff", fontFamily: "'Space Mono'", fontSize: 10 }}>
            This feature is incredible! 🎉
          </div>
          <div className="flex gap-1 mt-1">
            {["❤️ 3", "😂 2", "🔥 5"].map(r => (
              <span key={r} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(108,92,231,0.2)", border: "1px solid rgba(108,92,231,0.3)", color: "#fff", fontSize: 9 }}>{r}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <div>
          <div className="px-3 py-2 rounded-2xl text-xs" style={{ background: "linear-gradient(135deg,#6C5CE7,#a29bfe)", color: "#fff", fontFamily: "'Space Mono'", fontSize: 10 }}>
            <div className="mb-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.2)", borderLeft: "2px solid rgba(255,255,255,0.5)" }}>
              <p className="text-white/60" style={{ fontSize: 9 }}>↩ Replying to Alex</p>
              <p className="text-white/70" style={{ fontSize: 9 }}>This feature is incredible!</p>
            </div>
            Right?! I love the reactions too
          </div>
        </div>
      </div>
    </div>
  );
}

function AIMockup() {
  return (
    <div className="p-4 space-y-2">
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6C5CE7,#a29bfe)" }}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: 12 }}>smart_toy</span>
        </div>
        <div className="px-3 py-2 rounded-2xl text-xs flex-1" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", fontFamily: "'Space Mono'", fontSize: 10, lineHeight: 1.6 }}>
          Hi! I'm ChatVerse AI 🤖 Ask me anything — I can help you draft messages or translate text!
        </div>
      </div>
      <div className="flex justify-end">
        <div className="px-3 py-2 rounded-2xl text-xs" style={{ background: "linear-gradient(135deg,#6C5CE7,#a29bfe)", color: "#fff", fontFamily: "'Space Mono'", fontSize: 10 }}>
          Draft a message for my friend's birthday
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6C5CE7,#a29bfe)" }}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: 12 }}>smart_toy</span>
        </div>
        <div className="px-3 py-2 rounded-2xl text-xs" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", fontFamily: "'Space Mono'", fontSize: 10, lineHeight: 1.5 }}>
          🎂 "Wishing you the most amazing birthday! Hope this year brings you everything you dreamed of! 🎉"
        </div>
      </div>
    </div>
  );
}

function WaveformMockup() {
  const bars = [4,8,14,20,16,10,18,22,12,6,16,20,8,14,10,18,22,6,14,20,12,8,18,10,16,4,8,12];
  return (
    <div className="p-4">
      <div className="rounded-2xl px-3 py-2.5 flex items-center gap-3" style={{ background: "linear-gradient(135deg,#6C5CE7,#a29bfe)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>play_arrow</span>
        </div>
        <div className="flex items-end gap-[2px] h-6 flex-1">
          {bars.map((h, i) => (
            <div key={i} className="w-[3px] rounded-full"
              style={{
                height: h + "px",
                background: i < 14 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
              }} />
          ))}
        </div>
        <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Space Mono'", fontSize: 9 }}>0:12</span>
      </div>
    </div>
  );
}

function CallMockup() {
  return (
    <div className="relative rounded-2xl overflow-hidden mx-4 mb-2" style={{ background: "#0d0e14", aspectRatio: "16/9" }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
            style={{ background: "rgba(108,92,231,0.2)", border: "2px solid rgba(108,92,231,0.4)" }}>
            <span className="material-symbols-outlined" style={{ color: "#6C5CE7", fontSize: 20 }}>person</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Space Mono'", fontSize: 10 }}>Alex</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Space Mono'", fontSize: 9 }}>02:34</p>
        </div>
      </div>
      <div className="absolute bottom-2 right-2 w-16 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.5)" }}>
        <div className="w-full h-full flex items-center justify-center">
          <span className="material-symbols-outlined" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>videocam</span>
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {["mic", "videocam", "screen_share"].map(icon => (
          <div key={icon} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            <span className="material-symbols-outlined" style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{icon}</span>
          </div>
        ))}
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#ef4444" }}>
          <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 12 }}>call_end</span>
        </div>
      </div>
    </div>
  );
}

function StickerMockup() {
  const stickers = ["🐱","🐶","🐼","🦊","🐸","🦄","🐙","🦋","🌸","🎉","💥","🌈","⭐","💎","🔥","💜","🎵","🚀"];
  return (
    <div className="p-3">
      <div className="rounded-2xl p-2" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono'", fontSize: 9, letterSpacing: 2, marginBottom: 6, paddingLeft: 2 }}>STICKERS</p>
        <div className="grid grid-cols-9 gap-1">
          {stickers.map((s, i) => (
            <div key={i} className="flex items-center justify-center text-lg rounded-lg hover:scale-125 transition-transform cursor-pointer p-0.5"
              style={{ fontSize: 18 }}>{s}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GroupMockup() {
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-2 pb-2 mb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(116,185,255,0.15)", border: "1px solid rgba(116,185,255,0.3)" }}>
          <span className="material-symbols-outlined" style={{ color: "#74b9ff", fontSize: 14 }}>group</span>
        </div>
        <div>
          <p style={{ color: "#fff", fontFamily: "'Space Mono'", fontSize: 11, fontWeight: 700 }}>Dev Squad 🚀</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Space Mono'", fontSize: 9 }}>4 members</p>
        </div>
      </div>
      {[
        { name: "Alex",  msg: "PR is ready for review 👀",      color: "#6C5CE7" },
        { name: "Maya",  msg: "On it! Looks clean so far ✅",    color: "#00d4ff" },
        { name: "Jordan",msg: "Merging after tests pass 🎯",     color: "#55efc4" },
      ].map((m, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="w-5 h-5 rounded-lg shrink-0 flex items-center justify-center text-white" style={{ background: m.color, fontSize: 8, fontWeight: 700 }}>
            {m.name[0]}
          </div>
          <div>
            <p style={{ color: m.color, fontSize: 9, fontFamily: "'Space Mono'" }}>{m.name}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontFamily: "'Space Mono'" }}>{m.msg}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsMockup() {
  return (
    <div className="p-3 space-y-2">
      {[
        { label: "Dark Mode",        value: "ON",   accent: "#6C5CE7" },
        { label: "Read Receipts",    value: "ON",   accent: "#00d4ff" },
        { label: "Typing Indicator", value: "ON",   accent: "#55efc4" },
        { label: "Compact Mode",     value: "OFF",  accent: "#fd79a8" },
      ].map((s, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Space Mono'", fontSize: 10 }}>{s.label}</span>
          <div className="px-2 py-0.5 rounded-full text-xs" style={{
            background: s.value === "ON" ? `${s.accent}20` : "rgba(255,255,255,0.05)",
            border: `1px solid ${s.value === "ON" ? s.accent + "50" : "rgba(255,255,255,0.1)"}`,
            color: s.value === "ON" ? s.accent : "rgba(255,255,255,0.3)",
            fontFamily: "'Space Mono'",
            fontSize: 9,
          }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── RevealSection ─────────────────────────────────────────────────────────────
function RevealSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(30px)", transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>
      {children}
    </div>
  );
}

// ── FeaturesPage ──────────────────────────────────────────────────────────────
export default function FeaturesPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:wght@400;700&display=swap";
    document.head.appendChild(link);
    if (!document.querySelector('link[href*="material-symbols"]')) {
      const ms = document.createElement("link");
      ms.rel = "stylesheet";
      ms.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
      document.head.appendChild(ms);
    }
  }, []);

  return (
    <div style={{ background: "#00000f", color: "#fff", fontFamily: "'Space Mono', monospace", minHeight: "100vh", overflowX: "hidden", overflowY: "auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; overflow-y: auto !important; height: auto !important; scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #6C5CE7; border-radius: 2px; }
        @keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
      `}</style>

      <StarField />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(2,0,15,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(108,92,231,0.12)" }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#6C5CE7,#00d4ff)", boxShadow: "0 0 16px rgba(108,92,231,0.6)" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>M</span>
          </div>
          <span style={{ fontFamily: "'Orbitron', sans-serif", color: "#00d4ff", fontWeight: 700, fontSize: 15, letterSpacing: 3 }}>CHATVERSE</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")}
            className="text-sm px-4 py-2 rounded-full transition-all hover:text-white"
            style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Space Mono'" }}>← Home</button>
          <button onClick={() => navigate("/login")}
            className="text-sm px-5 py-2 rounded-full font-semibold"
            style={{ background: "linear-gradient(135deg,#6C5CE7,#00d4ff)", color: "#fff", fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 1 }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-36 pb-16 text-center px-6" style={{ zIndex: 10 }}>
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 8px #00d4ff" }} />
          <span style={{ fontFamily: "'Space Mono'", fontSize: 10, letterSpacing: 4, color: "#00d4ff" }}>FEATURE UNIVERSE</span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 8px #00d4ff" }} />
        </div>
        <h1 className="font-black mb-5" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(32px,6vw,72px)", lineHeight: 1.05 }}>
          Everything You Need<br />
          <span style={{ background: "linear-gradient(90deg,#6C5CE7,#00d4ff,#a29bfe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Already Inside
          </span>
        </h1>
        <p className="max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.8 }}>
          Explore every feature of ChatVerse — from AI-powered conversations to encrypted group chats, voice waveforms to WebRTC video calls.
        </p>
      </div>

      {/* Feature cards — alternating layout */}
      <div className="relative max-w-6xl mx-auto px-6 pb-24 space-y-24" style={{ zIndex: 10 }}>
        {FEATURES.map((f, i) => (
          <RevealSection key={f.id} delay={0}>
            <div className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-10 items-center`}>
              {/* Text side */}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-5 h-px" style={{ background: f.accent }} />
                  <span style={{ fontFamily: "'Space Mono'", fontSize: 9, letterSpacing: 4, color: f.accent }}>{f.tag}</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `${f.accent}18`, border: `1px solid ${f.accent}35` }}>
                    <span className="material-symbols-outlined" style={{ color: f.accent, fontSize: 18 }}>{f.icon}</span>
                  </div>
                  <h2 className="font-bold" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(16px,2.5vw,22px)", color: "#fff" }}>
                    {f.title}
                  </h2>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.9, fontSize: 13 }}>{f.desc}</p>
              </div>

              {/* Mockup side */}
              <div className="flex-1 min-w-0 w-full">
                <div className="rounded-3xl overflow-hidden" style={{
                  background: "rgba(10,8,30,0.8)",
                  border: `1px solid ${f.accent}25`,
                  boxShadow: `0 30px 80px ${f.accent}15`,
                  animation: "float 6s ease-in-out infinite",
                  animationDelay: `${i * 0.8}s`,
                }}>
                  {/* Window chrome */}
                  <div className="flex items-center gap-1.5 px-4 py-3" style={{ borderBottom: `1px solid ${f.accent}15` }}>
                    {["#ef4444","#f59e0b","#22c55e"].map(c => (
                      <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    ))}
                    <div className="flex-1 mx-3 h-4 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }} />
                  </div>
                  {f.mockup}
                </div>
              </div>
            </div>
          </RevealSection>
        ))}
      </div>

      {/* CTA */}
      <div className="relative text-center py-20 px-6" style={{ zIndex: 10 }}>
        <div className="max-w-lg mx-auto rounded-3xl p-12"
          style={{ background: "rgba(108,92,231,0.07)", border: "1px solid rgba(108,92,231,0.18)", backdropFilter: "blur(20px)" }}>
          <h2 className="text-2xl font-black mb-4" style={{ fontFamily: "'Orbitron', sans-serif", color: "#fff" }}>
            Ready to experience all of this?
          </h2>
          <p className="mb-8" style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Create your free account and pulse in seconds.</p>
          <button onClick={() => navigate("/login")}
            className="px-10 py-3 rounded-full font-bold text-sm text-white transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg,#6C5CE7,#00d4ff)",
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: 2,
              fontSize: 12,
              boxShadow: "0 0 30px rgba(108,92,231,0.4)",
            }}>
            Get Started Free
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative px-8 py-8 text-center" style={{ zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "'Space Mono'" }}>
          © 2024 ChatVerse. The Ethereal Pulse of Connection.
        </span>
      </footer>
    </div>
  );
}