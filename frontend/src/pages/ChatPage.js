import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import SimplePeer from "simple-peer";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useAppSettings } from "../context/AppSettingsContext";
import IncomingCallAlert from "../components/IncomingCallAlert";
import SettingsPanel from "../components/SettingsPanel";

const API = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

// ── Background SVG variables ──────────────────────────────────────────────────
const DARK_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500'%3E%3Crect width='500' height='500' fill='%230d0e16'/%3E%3Cg stroke='%232d2f52' stroke-width='1.1' fill='none' stroke-linecap='round' stroke-linejoin='round' opacity='0.85'%3E%3Cpath d='M30 20l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z'/%3E%3Cellipse cx='70' cy='35' rx='12' ry='8'/%3E%3Cellipse cx='82' cy='32' rx='9' ry='7'/%3E%3Cellipse cx='58' cy='34' rx='8' ry='6'/%3E%3Cpath d='M130 25 c0-5 8-8 8 0 c0-8 8-5 8 0 c0 6-8 12-8 12 c0 0-8-6-8-12z'/%3E%3Ccircle cx='200' cy='35' r='15'/%3E%3Cpath d='M190 22 l-5-8 4 8'/%3E%3Cpath d='M210 22 l5-8-4 8'/%3E%3Ccircle cx='195' cy='33' r='2.5'/%3E%3Ccircle cx='205' cy='33' r='2.5'/%3E%3Cpath d='M197 39 q3 3 6 0'/%3E%3Cpath d='M192 36 l-8 2'/%3E%3Cpath d='M208 36 l8 2'/%3E%3Cpath d='M270 15 l20 35 l-40 0z'/%3E%3Ccircle cx='270' cy='32' r='3'/%3E%3Ccircle cx='261' cy='38' r='2'/%3E%3Ccircle cx='279' cy='38' r='2'/%3E%3Cpath d='M340 15 l-8 18 h10 l-8 18'/%3E%3Cpath d='M390 20 l15 0 l5 10 l-20 20 l-20-20 l5-10z'/%3E%3Ccircle cx='450' cy='30' r='12'/%3E%3Cline x1='450' y1='42' x2='450' y2='65'/%3E%3Cpath d='M444 24 q6-8 12 0'/%3E%3Cellipse cx='30' cy='110' rx='12' ry='18'/%3E%3Ccircle cx='27' cy='103' r='2'/%3E%3Ccircle cx='33' cy='103' r='2'/%3E%3Cellipse cx='30' cy='109' rx='4' ry='3'/%3E%3Cpath d='M18 112 l-8 5'/%3E%3Cpath d='M42 112 l8 5'/%3E%3Crect x='85' y='100' width='10' height='20' rx='2'/%3E%3Ccircle cx='90' cy='97' r='10'/%3E%3Ccircle cx='83' cy='100' r='8'/%3E%3Ccircle cx='97' cy='100' r='8'/%3E%3Cpath d='M160 75 q0-20 10-30 q10 10 10 30 l-5 15 h-10z'/%3E%3Cpath d='M155 105 l-10 15 10-5'/%3E%3Cpath d='M175 105 l10 15-10-5'/%3E%3Ccircle cx='170' cy='92' r='5'/%3E%3Ccircle cx='240' cy='95' r='6'/%3E%3Ccircle cx='228' cy='88' r='7'/%3E%3Ccircle cx='252' cy='88' r='7'/%3E%3Ccircle cx='228' cy='102' r='7'/%3E%3Ccircle cx='252' cy='102' r='7'/%3E%3Cline x1='240' y1='101' x2='240' y2='125'/%3E%3Cellipse cx='320' cy='100' rx='20' ry='12'/%3E%3Cpath d='M300 100 l-15-10 0 20z'/%3E%3Ccircle cx='335' cy='96' r='3'/%3E%3Cpath d='M385 80 q-15 0-15 20 q0 20 15 20 q-20 0-20-20 q0-20 20-20z'/%3E%3Cpath d='M430 95 l0 25 l40 0 l0-25 l-10 15-10-18-10 18z'/%3E%3Ccircle cx='430' cy='95' r='3'/%3E%3Ccircle cx='450' cy='77' r='3'/%3E%3Ccircle cx='470' cy='95' r='3'/%3E%3Cellipse cx='50' cy='185' rx='18' ry='12'/%3E%3Cpath d='M32 185 q0-20 18-20 q18 0 18 20'/%3E%3Cpath d='M32 185 l-15 5'/%3E%3Cpath d='M40 165 l-2-8 m4 0 l-2 8'/%3E%3Cellipse cx='110' cy='175' rx='20' ry='14'/%3E%3Crect x='102' y='175' width='16' height='16' rx='3'/%3E%3Ccircle cx='100' cy='168' r='4'/%3E%3Ccircle cx='118' cy='165' r='3'/%3E%3Ccircle cx='112' cy='173' r='3'/%3E%3Cpath d='M165 200 q0-35 20-35 q15 0 15 20 l10-15 l0 30 l-15 5 l0 10 l-10 0 l0-10z'/%3E%3Ccircle cx='193' cy='170' r='3'/%3E%3Ccircle cx='260' cy='180' r='16'/%3E%3Cline x1='260' y1='156' x2='260' y2='148'/%3E%3Cline x1='260' y1='204' x2='260' y2='212'/%3E%3Cline x1='236' y1='180' x2='228' y2='180'/%3E%3Cline x1='284' y1='180' x2='292' y2='180'/%3E%3Cpath d='M330 175 q-20-20-25 0 q5 20 25 0'/%3E%3Cpath d='M330 175 q20-20 25 0 q-5 20-25 0'/%3E%3Crect x='395' y='175' width='40' height='35' rx='3'/%3E%3Crect x='393' y='168' width='44' height='10' rx='3'/%3E%3Cline x1='415' y1='168' x2='415' y2='210'/%3E%3Cpath d='M455 170 q0-28 28-28 q28 0 28 28z'/%3E%3Cline x1='469' y1='170' x2='469' y2='200'/%3E%3Cellipse cx='60' cy='270' rx='30' ry='18'/%3E%3Cpath d='M30 270 l-15-10 0 20z'/%3E%3Ccircle cx='140' cy='255' r='18'/%3E%3Cpath d='M140 273 l0 25'/%3E%3Ccircle cx='210' cy='265' r='20'/%3E%3Ccircle cx='197' cy='252' r='9'/%3E%3Ccircle cx='223' cy='252' r='9'/%3E%3Crect x='340' y='268' width='30' height='20' rx='3'/%3E%3Cpath d='M340 268 q15-25 30 0'/%3E%3Ccircle cx='355' cy='248' r='5'/%3E%3Cellipse cx='420' cy='275' rx='14' ry='20'/%3E%3Crect x='50' y='360' width='60' height='40' rx='2'/%3E%3Crect x='46' y='348' width='12' height='20'/%3E%3Crect x='62' y='348' width='12' height='20'/%3E%3Crect x='98' y='348' width='12' height='20'/%3E%3Cellipse cx='155' cy='375' rx='18' ry='12'/%3E%3Ccircle cx='165' cy='362' r='10'/%3E%3Cpath d='M175 364 l10 0 l0 5 l-10 0'/%3E%3Ccircle cx='330' cy='375' r='18'/%3E%3Ccircle cx='315' cy='360' r='10'/%3E%3Ccircle cx='345' cy='360' r='10'/%3E%3Cellipse cx='430' cy='375' rx='35' ry='16'/%3E%3Ccircle cx='430' cy='363' r='6'/%3E%3Cpath d='M80 430 l0-30 q0-15 15-15 q15 0 15 15'/%3E%3Cellipse cx='175' cy='430' rx='22' ry='28'/%3E%3Crect x='167' y='457' width='16' height='12' rx='3'/%3E%3Ccircle cx='270' cy='418' r='8'/%3E%3Cline x1='270' y1='426' x2='270' y2='460'/%3E%3Cpath d='M255 460 q15 8 30 0'/%3E%3Cpath d='M258 435 l-14 0 m28 0 l14 0'/%3E%3Cpath d='M410 420 l0 30 m0-30 l20-8 l0 30'/%3E%3Ccircle cx='410' cy='450' r='5'/%3E%3Ccircle cx='430' cy='442' r='5'/%3E%3Ccircle cx='115' cy='155' r='2'/%3E%3Ccircle cx='300' cy='140' r='2'/%3E%3Ccircle cx='480' cy='160' r='2'/%3E%3Ccircle cx='360' cy='250' r='2'/%3E%3Ccircle cx='490' cy='320' r='2'/%3E%3Ccircle cx='145' cy='340' r='2'/%3E%3Ccircle cx='485' cy='440' r='2'/%3E%3Cpath d='M350 460 l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z'/%3E%3Cpath d='M480 390 l1.5 4h4l-3 2.5 1.5 4-4-2.5-4 2.5 1.5-4-3-2.5h4z'/%3E%3Cpath d='M10 300 l1.5 4h4l-3 2.5 1.5 4-4-2.5-4 2.5 1.5-4-3-2.5h4z'/%3E%3C/g%3E%3C/svg%3E") repeat`;
const LIGHT_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500'%3E%3Crect width='500' height='500' fill='%23f0eeff'/%3E%3Cg stroke='%236C5CE7' stroke-width='1.1' fill='none' stroke-linecap='round' stroke-linejoin='round' opacity='0.18'%3E%3Cpath d='M30 20l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z'/%3E%3Cellipse cx='70' cy='35' rx='12' ry='8'/%3E%3Cellipse cx='82' cy='32' rx='9' ry='7'/%3E%3Cellipse cx='58' cy='34' rx='8' ry='6'/%3E%3Cpath d='M130 25 c0-5 8-8 8 0 c0-8 8-5 8 0 c0 6-8 12-8 12 c0 0-8-6-8-12z'/%3E%3Ccircle cx='200' cy='35' r='15'/%3E%3Cpath d='M190 22 l-5-8 4 8'/%3E%3Cpath d='M210 22 l5-8-4 8'/%3E%3Ccircle cx='195' cy='33' r='2.5'/%3E%3Ccircle cx='205' cy='33' r='2.5'/%3E%3Cpath d='M197 39 q3 3 6 0'/%3E%3Cpath d='M192 36 l-8 2'/%3E%3Cpath d='M208 36 l8 2'/%3E%3Cpath d='M270 15 l20 35 l-40 0z'/%3E%3Ccircle cx='270' cy='32' r='3'/%3E%3Ccircle cx='261' cy='38' r='2'/%3E%3Ccircle cx='279' cy='38' r='2'/%3E%3Cpath d='M340 15 l-8 18 h10 l-8 18'/%3E%3Cpath d='M390 20 l15 0 l5 10 l-20 20 l-20-20 l5-10z'/%3E%3Ccircle cx='450' cy='30' r='12'/%3E%3Cline x1='450' y1='42' x2='450' y2='65'/%3E%3Cpath d='M444 24 q6-8 12 0'/%3E%3Cellipse cx='30' cy='110' rx='12' ry='18'/%3E%3Ccircle cx='27' cy='103' r='2'/%3E%3Ccircle cx='33' cy='103' r='2'/%3E%3Cellipse cx='30' cy='109' rx='4' ry='3'/%3E%3Cpath d='M18 112 l-8 5'/%3E%3Cpath d='M42 112 l8 5'/%3E%3Crect x='85' y='100' width='10' height='20' rx='2'/%3E%3Ccircle cx='90' cy='97' r='10'/%3E%3Ccircle cx='83' cy='100' r='8'/%3E%3Ccircle cx='97' cy='100' r='8'/%3E%3Cpath d='M160 75 q0-20 10-30 q10 10 10 30 l-5 15 h-10z'/%3E%3Cpath d='M155 105 l-10 15 10-5'/%3E%3Cpath d='M175 105 l10 15-10-5'/%3E%3Ccircle cx='170' cy='92' r='5'/%3E%3Ccircle cx='240' cy='95' r='6'/%3E%3Ccircle cx='228' cy='88' r='7'/%3E%3Ccircle cx='252' cy='88' r='7'/%3E%3Ccircle cx='228' cy='102' r='7'/%3E%3Ccircle cx='252' cy='102' r='7'/%3E%3Cline x1='240' y1='101' x2='240' y2='125'/%3E%3Cellipse cx='320' cy='100' rx='20' ry='12'/%3E%3Cpath d='M300 100 l-15-10 0 20z'/%3E%3Cpath d='M385 80 q-15 0-15 20 q0 20 15 20 q-20 0-20-20 q0-20 20-20z'/%3E%3Cpath d='M430 95 l0 25 l40 0 l0-25 l-10 15-10-18-10 18z'/%3E%3Ccircle cx='430' cy='95' r='3'/%3E%3Ccircle cx='450' cy='77' r='3'/%3E%3Ccircle cx='470' cy='95' r='3'/%3E%3Cellipse cx='50' cy='185' rx='18' ry='12'/%3E%3Cellipse cx='110' cy='175' rx='20' ry='14'/%3E%3Crect x='102' y='175' width='16' height='16' rx='3'/%3E%3Cpath d='M165 200 q0-35 20-35 q15 0 15 20 l10-15 l0 30 l-15 5 l0 10 l-10 0 l0-10z'/%3E%3Ccircle cx='260' cy='180' r='16'/%3E%3Cpath d='M330 175 q-20-20-25 0 q5 20 25 0'/%3E%3Cpath d='M330 175 q20-20 25 0 q-5 20-25 0'/%3E%3Crect x='395' y='175' width='40' height='35' rx='3'/%3E%3Cpath d='M455 170 q0-28 28-28 q28 0 28 28z'/%3E%3Cellipse cx='60' cy='270' rx='30' ry='18'/%3E%3Ccircle cx='140' cy='255' r='18'/%3E%3Ccircle cx='210' cy='265' r='20'/%3E%3Ccircle cx='197' cy='252' r='9'/%3E%3Ccircle cx='223' cy='252' r='9'/%3E%3Crect x='340' y='268' width='30' height='20' rx='3'/%3E%3Cpath d='M340 268 q15-25 30 0'/%3E%3Cellipse cx='420' cy='275' rx='14' ry='20'/%3E%3Crect x='50' y='360' width='60' height='40' rx='2'/%3E%3Cellipse cx='155' cy='375' rx='18' ry='12'/%3E%3Ccircle cx='165' cy='362' r='10'/%3E%3Ccircle cx='330' cy='375' r='18'/%3E%3Ccircle cx='315' cy='360' r='10'/%3E%3Ccircle cx='345' cy='360' r='10'/%3E%3Cellipse cx='430' cy='375' rx='35' ry='16'/%3E%3Cpath d='M80 430 l0-30 q0-15 15-15 q15 0 15 15'/%3E%3Cellipse cx='175' cy='430' rx='22' ry='28'/%3E%3Ccircle cx='270' cy='418' r='8'/%3E%3Cpath d='M410 420 l0 30 m0-30 l20-8 l0 30'/%3E%3Ccircle cx='410' cy='450' r='5'/%3E%3Ccircle cx='430' cy='442' r='5'/%3E%3Ccircle cx='115' cy='155' r='2'/%3E%3Ccircle cx='300' cy='140' r='2'/%3E%3Ccircle cx='480' cy='160' r='2'/%3E%3Ccircle cx='360' cy='250' r='2'/%3E%3Cpath d='M350 460 l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z'/%3E%3C/g%3E%3C/svg%3E") repeat`;

// ── Sticker data ──────────────────────────────────────────────────────────────
const STICKERS = [
  { id: 1,  emoji: "🐱", label: "Cat" },
  { id: 2,  emoji: "🐶", label: "Dog" },
  { id: 3,  emoji: "🐼", label: "Panda" },
  { id: 4,  emoji: "🦊", label: "Fox" },
  { id: 5,  emoji: "🐸", label: "Frog" },
  { id: 6,  emoji: "🦄", label: "Unicorn" },
  { id: 7,  emoji: "🐙", label: "Octopus" },
  { id: 8,  emoji: "🦋", label: "Butterfly" },
  { id: 9,  emoji: "🌸", label: "Blossom" },
  { id: 10, emoji: "🎉", label: "Party" },
  { id: 11, emoji: "💥", label: "Boom" },
  { id: 12, emoji: "🌈", label: "Rainbow" },
  { id: 13, emoji: "⭐", label: "Star" },
  { id: 14, emoji: "💎", label: "Diamond" },
  { id: 15, emoji: "🔥", label: "Fire" },
  { id: 16, emoji: "💜", label: "Heart" },
  { id: 17, emoji: "🎵", label: "Music" },
  { id: 18, emoji: "🚀", label: "Rocket" },
];

// ── Virtual background options ─────────────────────────────────────────────────
const VBGS = [
  { id: "none",    label: "None",       style: {} },
  { id: "blur",    label: "Blur",       style: { filter: "blur(8px)" } },
  { id: "office",  label: "Office",     color: "#1a1a2e" },
  { id: "beach",   label: "Beach",      color: "#0077b6" },
  { id: "forest",  label: "Forest",     color: "#1b4332" },
  { id: "galaxy",  label: "Galaxy",     color: "#0d0221" },
];

// ── AI Bot contact ────────────────────────────────────────────────────────────
const AI_BOT = {
  _id: "chatverse-ai",
  username: "ChatVerse AI",
  avatar: null,
  isAI: true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

// ── UI Atoms ──────────────────────────────────────────────────────────────────
function ChatVerseLogo() {
  return (
    <div className="relative flex items-center justify-center">
      <style>{`
        @keyframes glowPulse{0%,100%{text-shadow:0 0 8px rgba(108,92,231,.9),0 0 20px rgba(108,92,231,.6)}50%{text-shadow:0 0 14px rgba(108,92,231,1),0 0 40px rgba(108,92,231,.8)}}
        @keyframes titleGlow{0%,100%{filter:drop-shadow(0 0 6px rgba(108,92,231,.7))}50%{filter:drop-shadow(0 0 14px rgba(108,92,231,1))}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes stickerPop{0%{transform:scale(0) rotate(-20deg)}60%{transform:scale(1.2) rotate(5deg)}100%{transform:scale(1) rotate(0deg)}}
        @keyframes waveBar{0%,100%{height:4px}50%{height:20px}}
        @keyframes reactionPop{0%{transform:scale(0)}70%{transform:scale(1.3)}100%{transform:scale(1)}}
      `}</style>
      <span className="text-[#6C5CE7] font-extrabold text-2xl select-none"
        style={{ animation: "glowPulse 2.5s ease-in-out infinite" }}>M</span>
    </div>
  );
}

function PanelTitle({ text }) {
  if (text === "ChatVerse") {
    return (
      <h1 className="text-lg font-extrabold" style={{
        background: "linear-gradient(135deg,#6C5CE7,#a19afd,#6C5CE7)",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        animation: "titleGlow 2.5s ease-in-out infinite, slideIn 0.4s ease-out",
      }}>ChatVerse</h1>
    );
  }
  return <h1 className="text-lg font-bold text-on-surface" style={{ animation: "slideIn 0.3s ease-out" }}>{text}</h1>;
}

function Avatar({ user: u, size = "md" }) {
  const cls = { sm: "w-8 h-8 text-xs rounded-xl", md: "w-12 h-12 text-base rounded-2xl", lg: "w-16 h-16 text-xl rounded-2xl" }[size] || "w-12 h-12 rounded-2xl";
  if (u?.isAI) return (
    <div className={cls + " bg-gradient-to-br from-[#6C5CE7] to-[#a19afd] flex items-center justify-center shrink-0 shadow-lg shadow-[#6C5CE7]/30"}>
      <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
    </div>
  );
  const src = u?.avatar ? API + u.avatar : null;
  return src
    ? <img src={src} alt={u?.username} className={cls + " object-cover shrink-0"} />
    : <div className={cls + " bg-primary-container flex items-center justify-center font-bold text-white shrink-0"}>{u?.username?.[0]?.toUpperCase() || "?"}</div>;
}

// ── Feature 3: Voice Waveform ─────────────────────────────────────────────────
function VoiceWaveform({ src, isSent, isDark }) {
  const bars = Array.from({ length: 28 }, (_, i) => {
    const heights = [4, 8, 14, 20, 16, 10, 18, 22, 12, 6, 16, 20, 8, 14, 10, 18, 22, 6, 14, 20, 12, 8, 18, 10, 16, 4, 8, 12];
    return heights[i % heights.length];
  });
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const [ready, setReady]       = useState(false);
  const audioRef = useRef(null);

  // Fix 5: wait for metadata before allowing play, handle all error cases
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onMeta    = () => { setDuration(audio.duration || 0); setReady(true); };
    const onTime    = () => {
      const dur = audio.duration;
      if (dur && isFinite(dur)) {
        setProgress((audio.currentTime / dur) * 100);
        setElapsed(audio.currentTime);
      }
    };
    const onEnd     = () => { setPlaying(false); setProgress(0); setElapsed(0); };
    const onError   = () => { setPlaying(false); setReady(false); };
    const onCanPlay = () => setReady(true);

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onError);
    // Trigger load in case src is already set
    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onError);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        await audio.play();
        setPlaying(true);
      }
    } catch (err) {
      console.error("Audio play error:", err);
      setPlaying(false);
    }
  };

  const fmt = s => {
    if (!s || !isFinite(s)) return "0:00";
    return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;
  };

  const filled   = isSent ? "bg-white" : "bg-[#6C5CE7]";
  const unfilled = isSent ? "bg-white/40" : isDark ? "bg-white/20" : "bg-[#6C5CE7]/25";

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl min-w-[200px] ${isSent ? "bg-[#6C5CE7] shadow-lg shadow-[#6C5CE7]/30" : isDark ? "bg-white/10" : "bg-white shadow-sm"}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={togglePlay} disabled={!ready}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-50
          ${isSent ? "bg-white/20 hover:bg-white/30" : "bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/20"}`}>
        <span className={`material-symbols-outlined text-sm ${isSent ? "text-white" : "text-[#6C5CE7]"}`}>
          {playing ? "pause" : "play_arrow"}
        </span>
      </button>
      <div className="flex items-end gap-[2px] h-6 flex-1">
        {bars.map((h, i) => {
          const pct = (i / bars.length) * 100;
          const isActive = pct <= progress;
          return (
            <div key={i}
              className={`w-[3px] rounded-full transition-all ${isActive ? filled : unfilled}`}
              style={{ height: h + "px", animation: playing ? `waveBar ${0.4 + (i % 5) * 0.1}s ease-in-out ${i * 0.02}s infinite` : "none" }} />
          );
        })}
      </div>
      <span className={`text-[10px] font-mono shrink-0 w-8 text-right ${isSent ? "text-white/70" : isDark ? "text-white/40" : "text-on-surface-variant"}`}>
        {playing ? fmt(elapsed) : fmt(duration)}
      </span>
    </div>
  );
}

// ── Feature 1: Reaction Bar ───────────────────────────────────────────────────
const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

function ReactionBar({ onReact, isSent, isDark }) {
  return (
    <div className={`absolute ${isSent ? "right-0" : "left-0"} -top-10 z-30 flex gap-1 px-2 py-1.5 rounded-full shadow-xl border backdrop-blur-md
      ${isDark ? "bg-[#1a1b23]/95 border-white/10" : "bg-white/95 border-outline-variant/30"}`}
      style={{ animation: "reactionPop 0.2s ease-out" }}>
      {REACTION_EMOJIS.map(e => (
        <button key={e} onClick={() => onReact(e)}
          className="text-lg hover:scale-125 transition-transform active:scale-90">
          {e}
        </button>
      ))}
    </div>
  );
}

// ── Feature 2: Reply Preview ──────────────────────────────────────────────────
function ReplyPreview({ msg, onClear, isDark }) {
  if (!msg) return null;
  const previewText = msg.type && msg.type !== "text"
    ? { image: "📷 Photo", audio: "🎵 Voice message", video: "🎬 Video", file: "📎 File", sticker: "🎭 Sticker" }[msg.type] || `📎 ${msg.type}`
    : msg.content;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 border-l-4 border-[#6C5CE7] rounded-r-xl ${isDark ? "bg-[#6C5CE7]/10" : "bg-[#6C5CE7]/8"}`}
      style={{ animation: "fadeUp 0.15s ease-out" }}>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-[#6C5CE7] mb-0.5">
          Replying to {msg.senderName}
        </p>
        <p className={`text-xs truncate ${isDark ? "text-white/60" : "text-on-surface-variant"}`}>
          {previewText}
        </p>
      </div>
      <button onClick={onClear}
        className={`shrink-0 p-1 rounded-full ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
        <span className={`material-symbols-outlined text-sm ${isDark ? "text-white/40" : "text-on-surface-variant"}`}>close</span>
      </button>
    </div>
  );
}

// ── Feature 8: Group Chat Modal ───────────────────────────────────────────────
function CreateGroupModal({ contacts, onClose, onCreate, isDark }) {
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState([]);
  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className={`w-96 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 ${isDark ? "bg-[#1a1b23]" : "bg-white"}`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-on-surface"}`}>Create Group</h2>
          <button onClick={onClose} className={`p-1.5 rounded-full ${isDark ? "hover:bg-white/10" : "hover:bg-surface-container"}`}>
            <span className={`material-symbols-outlined text-sm ${isDark ? "text-white/50" : "text-on-surface-variant"}`}>close</span>
          </button>
        </div>

        {/* Group name */}
        <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? "bg-white/5" : "bg-surface-container-low"}`}>
          <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#6C5CE7]">group</span>
          </div>
          <input value={groupName} onChange={e => setGroupName(e.target.value)}
            placeholder="Group name..."
            className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-white placeholder:text-white/30" : "text-on-surface placeholder:text-on-surface-variant/50"}`} />
        </div>

        {/* Member select */}
        <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-on-surface-variant"}`}>
          Add members ({selected.length} selected)
        </p>
        <div className="flex flex-col gap-1 max-h-52 overflow-y-auto custom-scrollbar">
          {contacts.map(c => (
            <div key={c._id}
              onClick={() => toggle(c._id)}
              className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${selected.includes(c._id)
                ? isDark ? "bg-[#6C5CE7]/20 border border-[#6C5CE7]/40" : "bg-[#6C5CE7]/10 border border-[#6C5CE7]/30"
                : isDark ? "hover:bg-white/5" : "hover:bg-surface-container-low"}`}>
              <Avatar user={c} size="sm" />
              <span className={`text-sm font-medium flex-1 ${isDark ? "text-white" : "text-on-surface"}`}>{c.username}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected.includes(c._id) ? "bg-[#6C5CE7] border-[#6C5CE7]" : isDark ? "border-white/20" : "border-outline-variant"}`}>
                {selected.includes(c._id) && <span className="material-symbols-outlined text-white text-[12px]">check</span>}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => { if (groupName.trim() && selected.length > 0) onCreate(groupName.trim(), selected); }}
          disabled={!groupName.trim() || selected.length === 0}
          className="py-3 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg,#6C5CE7,#a19afd)" }}>
          Create Group ({selected.length} members)
        </button>
      </div>
    </div>
  );
}

// ── Feature 5: Sticker Picker ─────────────────────────────────────────────────
function StickerPicker({ onSend, onClose, isDark }) {
  return (
    <div className={`absolute bottom-20 left-36 rounded-2xl shadow-xl border p-3 z-30 ${isDark ? "bg-[#1a1b23] border-white/10" : "bg-white border-outline-variant"}`}
      style={{ animation: "fadeUp 0.15s ease-out" }}>
      <div className="flex items-center justify-between mb-2 px-1">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-on-surface-variant"}`}>Stickers</p>
        <button onClick={onClose} className={`p-0.5 rounded-full ${isDark ? "hover:bg-white/10" : "hover:bg-surface-container"}`}>
          <span className={`material-symbols-outlined text-xs ${isDark ? "text-white/40" : "text-on-surface-variant"}`}>close</span>
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {STICKERS.map(s => (
          <button key={s.id} onClick={() => { onSend(s); onClose(); }}
            title={s.label}
            className={`text-3xl p-1.5 rounded-xl transition-all hover:scale-110 active:scale-90 ${isDark ? "hover:bg-white/10" : "hover:bg-surface-container"}`}
            style={{ animation: `stickerPop 0.3s ease-out ${s.id * 0.02}s both` }}>
            {s.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Feature 7: Virtual Background Picker ─────────────────────────────────────
function VirtualBgPicker({ current, onChange, onClose, isDark }) {
  return (
    <div className={`absolute bottom-14 right-40 rounded-2xl shadow-xl border p-3 z-30 w-56 ${isDark ? "bg-[#1a1b23] border-white/10" : "bg-white border-outline-variant"}`}
      style={{ animation: "fadeUp 0.15s ease-out" }}>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-on-surface-variant"}`}>Virtual Background</p>
      <div className="grid grid-cols-3 gap-2">
        {VBGS.map(bg => (
          <button key={bg.id} onClick={() => onChange(bg.id)}
            className={`h-12 rounded-xl border-2 transition-all overflow-hidden text-[10px] font-semibold flex items-end justify-center pb-1
              ${current === bg.id ? "border-[#6C5CE7] scale-105" : isDark ? "border-white/10 hover:border-white/30" : "border-outline-variant hover:border-[#6C5CE7]/40"}`}
            style={{ background: bg.color || (isDark ? "#2d2f52" : "#e8e7f2") }}>
            <span className={current === bg.id ? "text-white" : isDark ? "text-white/60" : "text-on-surface-variant"}>{bg.label}</span>
          </button>
        ))}
      </div>
      <button onClick={onClose} className="mt-2 w-full text-xs text-[#6C5CE7] hover:underline text-center">Done</button>
    </div>
  );
}

// ── Real WebRTC Call Modal (video + voice + screen share) ─────────────────────

function CallModal({ callData, onEnd, isIncoming = false }) {
  const { socket } = useSocket();
  const [stream, setStream]               = useState(null);
  const [callActive, setCallActive]       = useState(false);
  const [muted, setMuted]                 = useState(false);
  const [camOff, setCamOff]               = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callDuration, setCallDuration]   = useState(0);
  const localVideoRef   = useRef(null);
  const remoteVideoRef  = useRef(null);
  const timerRef        = useRef(null);
  const peerRef         = useRef(null);
  const screenStreamRef = useRef(null);
  const isVideo = callData?.callType === "video";

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    peerRef.current?.destroy();
    stream?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
  }, [stream]);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
        setStream(s);
        if (localVideoRef.current) localVideoRef.current.srcObject = s;
        if (!isIncoming) {
          const p = new SimplePeer({ initiator: true, trickle: false, stream: s });
          p.on("signal", signal => {
            socket?.emit("callUser", { userToCall: callData.userId, signalData: signal, from: callData.myId, callType: callData.callType });
          });
          p.on("stream", remoteStream => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream; });
          peerRef.current = p;
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
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    });
    socket.on("iceCandidate", ({ candidate }) => { peerRef.current?.signal(candidate); });
    socket.on("callEnded",   () => { cleanup(); onEnd(); });
    socket.on("callRejected",() => { cleanup(); onEnd(); });
    if (isIncoming && stream) {
      const p = new SimplePeer({ initiator: false, trickle: false, stream });
      p.on("signal", signal => { socket.emit("answerCall", { to: callData.from, signal }); });
      p.on("stream", remoteStream => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream; });
      p.signal(callData.signal);
      peerRef.current = p;
      setCallActive(true);
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => {
      socket.off("callAccepted"); socket.off("iceCandidate");
      socket.off("callEnded");    socket.off("callRejected");
    };
  }, [socket, stream]); // eslint-disable-line

  const endCall = () => {
    socket?.emit("endCall", { to: isIncoming ? callData.from : callData.userId });
    cleanup(); onEnd();
  };

  const toggleMute = () => {
    stream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMuted(m => !m);
  };

  const toggleCam = () => {
    stream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOff(c => !c);
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerRef.current?._pc?.getSenders().find(s => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = stopScreenShare;
        setScreenSharing(true);
        socket?.emit("screenShare", { to: isIncoming ? callData.from : callData.userId, sharing: true });
      } catch (err) { console.error("Screen share error:", err); }
    } else { stopScreenShare(); }
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    const camTrack = stream?.getVideoTracks()[0];
    const sender = peerRef.current?._pc?.getSenders().find(s => s.track?.kind === "video");
    if (sender && camTrack) sender.replaceTrack(camTrack);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    setScreenSharing(false);
    socket?.emit("screenShare", { to: isIncoming ? callData.from : callData.userId, sharing: false });
  };

  const fmt = s => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur flex items-center justify-center">
      <div className="relative w-full max-w-3xl mx-4 rounded-3xl overflow-hidden bg-[#1a1b23] shadow-2xl">
        {/* Remote video / voice UI */}
        <div className="relative aspect-video bg-[#0d0e14] flex items-center justify-center">
          {isVideo
            ? <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-4">
                {/* Fix 4: Radar waves while connecting, static ring when active */}
                <div className="relative flex items-center justify-center">
                  {!callActive && (<>
                    <span className="absolute inline-flex w-24 h-24 rounded-full bg-[#6C5CE7]/20 animate-ping" style={{animationDuration:"1.2s"}} />
                    <span className="absolute inline-flex w-32 h-32 rounded-full bg-[#6C5CE7]/12 animate-ping" style={{animationDuration:"1.6s",animationDelay:"0.2s"}} />
                    <span className="absolute inline-flex w-40 h-40 rounded-full bg-[#6C5CE7]/8 animate-ping" style={{animationDuration:"2s",animationDelay:"0.4s"}} />
                  </>)}
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all
                    ${callActive
                      ? "bg-[#6C5CE7]/20 border-[#6C5CE7]/60"
                      : "bg-[#6C5CE7]/25 border-[#6C5CE7]/50"}`}>
                    <span className="material-symbols-outlined text-5xl text-[#6C5CE7]">person</span>
                  </div>
                </div>
                <p className="text-white font-semibold text-lg">{callData?.name || "Voice Call"}</p>
                <p className="text-white/50 text-sm">{callActive ? fmt(callDuration) : "Connecting..."}</p>
              </div>
          }
          {isVideo && callActive && (
            <div className="absolute top-4 left-4 bg-black/50 text-white text-xs font-mono px-3 py-1 rounded-full backdrop-blur">
              {fmt(callDuration)}
            </div>
          )}
          {screenSharing && (
            <div className="absolute top-4 right-4 bg-[#6C5CE7]/80 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">screen_share</span>
              Sharing Screen
            </div>
          )}
          {isVideo && (
            <div className="absolute bottom-4 right-4 w-32 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-xl">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 py-5 bg-[#1a1b23]">
          <button onClick={toggleMute} title={muted ? "Unmute" : "Mute"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${muted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
            <span className="material-symbols-outlined text-xl">{muted ? "mic_off" : "mic"}</span>
          </button>
          {isVideo && (
            <button onClick={toggleCam} title={camOff ? "Turn on camera" : "Turn off camera"}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${camOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
              <span className="material-symbols-outlined text-xl">{camOff ? "videocam_off" : "videocam"}</span>
            </button>
          )}
          {isVideo && (
            <button onClick={toggleScreenShare} title="Share screen"
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${screenSharing ? "bg-[#6C5CE7] text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
              <span className="material-symbols-outlined text-xl">screen_share</span>
            </button>
          )}
          <button onClick={endCall} title="End call"
            className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all hover:scale-105">
            <span className="material-symbols-outlined text-xl">call_end</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble (with Reactions + Reply support) ───────────────────────────
function MessageBubble({ msg, isSent, isDark, onReact, onReply, reactions }) {
  const { settings } = useAppSettings();
  const fileUrl = msg.fileUrl ? API + msg.fileUrl : null;
  const accent = settings.accentColor || "#6C5CE7";
  const receivedCls = isDark ? "bg-white/10 text-white" : "bg-surface-container-lowest text-on-surface";
  const [showReactions, setShowReactions] = useState(false);
  const hoverTimer = useRef(null);

  const startHover = () => { hoverTimer.current = setTimeout(() => setShowReactions(true), 600); };
  const endHover = () => { clearTimeout(hoverTimer.current); setShowReactions(false); };

  const grouped = reactions?.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {}) || {};

  const bubbleContent = () => {
    if (msg.type === "sticker") return (
      <div className="text-5xl p-2" style={{ animation: "stickerPop 0.4s ease-out" }}>{msg.content}</div>
    );
    if (msg.type === "image") return (
      <div className="p-2 rounded-2xl shadow-sm bg-surface-container-lowest">
        <img src={fileUrl} alt={msg.fileName || "image"} className="rounded-xl max-w-[240px] max-h-[180px] object-cover cursor-pointer hover:opacity-90"
          onClick={() => window.open(fileUrl, "_blank")} />
      </div>
    );
    if (msg.type === "audio" || msg.type === "ai_voice") return (
      <VoiceWaveform src={fileUrl} isSent={isSent} isDark={isDark} />
    );
    if (msg.type === "video") return (
      <div className="p-2 rounded-2xl shadow-sm bg-surface-container-lowest">
        <video controls src={fileUrl} className="rounded-xl max-w-[240px] max-h-[180px]" />
      </div>
    );
    if (msg.type === "file") return (
      <div className={"p-3 rounded-2xl shadow-sm flex items-center gap-3 " + (isSent ? "bg-[#6C5CE7]" : isDark ? "bg-white/10" : "bg-white")}>
        <div className={"w-9 h-9 rounded-xl flex items-center justify-center " + (isSent ? "bg-white/20" : "bg-[#6C5CE7]/10")}>
          <span className={"material-symbols-outlined text-sm " + (isSent ? "text-white" : "text-[#6C5CE7]")}>folder_zip</span>
        </div>
        <div>
          <p className={"text-xs font-semibold truncate max-w-[140px] " + (isSent ? "text-white" : isDark ? "text-white" : "text-on-surface")}>{msg.fileName}</p>
          <p className={"text-[10px] " + (isSent ? "text-white/60" : "text-on-surface-variant")}>{formatSize(msg.fileSize)}</p>
        </div>
        <a href={fileUrl} download={msg.fileName} className={isSent ? "text-white/80 hover:text-white" : "text-[#6C5CE7]"}>
          <span className="material-symbols-outlined text-sm">download</span>
        </a>
      </div>
    );
    // Text bubble — with quoted reply if present
    const replyQuoteText = msg.replyTo?.type && msg.replyTo.type !== "text"
      ? { image: "📷 Photo", audio: "🎵 Voice message", video: "🎬 Video", file: "📎 File", sticker: "🎭 Sticker" }[msg.replyTo.type] || `📎 ${msg.replyTo.type}`
      : msg.replyTo?.content;

    return (
      <div
        className={`p-4 rounded-2xl text-sm shadow-sm ${isSent ? "text-white sent-bubble" : receivedCls + " received-bubble"}`}
        style={isSent ? { background: accent, boxShadow: `0 8px 16px ${accent}30` } : {}}
      >
        {/* Reply quote — visible to BOTH sender and receiver from DB */}
        {msg.replyTo?.content && (
          <div className={`mb-2 px-2.5 py-2 rounded-xl border-l-[3px] border-white/60 ${isSent ? "bg-black/15" : isDark ? "bg-white/10" : "bg-black/5"}`}>
            <p className={`text-[10px] font-bold mb-0.5 truncate ${isSent ? "text-white/80" : "text-[#6C5CE7]"}`}>
              ↩ {msg.replyTo.senderName}
            </p>
            <p className={`text-[11px] truncate ${isSent ? "text-white/60" : isDark ? "text-white/50" : "text-on-surface-variant"}`}>
              {replyQuoteText}
            </p>
          </div>
        )}
        <span>{msg.content}</span>
      </div>
    );
  };

  const isSticker = msg.type === "sticker";
  const isTextLike = msg.type === "text" || !msg.type; // text bubbles render their own wrapper

  return (
    <div className="relative group" onMouseEnter={startHover} onMouseLeave={endHover}>
      {/* Reaction bar on hover */}
      {showReactions && !isSticker && (
        <ReactionBar onReact={emoji => { onReact(msg._id, emoji); setShowReactions(false); }} isSent={isSent} isDark={isDark} />
      )}

      {/* Bubble content — text type renders its own wrapper with reply quote inside */}
      {bubbleContent()}

      {/* Reaction display */}
      {Object.keys(grouped).length > 0 && (
        <div className={`flex gap-1 mt-1 flex-wrap ${isSent ? "justify-end" : "justify-start"}`}>
          {Object.entries(grouped).map(([emoji, count]) => (
            <span key={emoji}
              className={`text-xs px-1.5 py-0.5 rounded-full border cursor-pointer hover:scale-110 transition-transform
                ${isDark ? "bg-white/10 border-white/10" : "bg-surface-container border-outline-variant/30"}`}>
              {emoji}{count > 1 ? ` ${count}` : ""}
            </span>
          ))}
        </div>
      )}

      {/* Reply button — appears on hover beside bubble */}
      <button onClick={() => onReply(msg)}
        className={`absolute ${isSent ? "-left-8" : "-right-8"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity
          w-6 h-6 rounded-full flex items-center justify-center ${isDark ? "bg-white/10 text-white/50 hover:text-white" : "bg-surface-container text-on-surface-variant hover:text-[#6C5CE7]"}`}>
        <span className="material-symbols-outlined text-xs">reply</span>
      </button>
    </div>
  );
}

// ── Conversation Row ──────────────────────────────────────────────────────────
function ConversationRow({ contact, unread, lastMsg, active, onClick, isOnline }) {
  const { settings } = useAppSettings();
  const isDark  = settings.theme === "dark";
  const textPri = isDark ? "text-white"    : "text-on-surface";
  const textSec = isDark ? "text-white/50" : "text-on-surface-variant";
  const activeCls = isDark ? "bg-white/10" : "bg-surface-container-low";
  const hoverCls  = isDark ? "hover:bg-white/6" : "hover:bg-surface-container-low/50";

  return (
    <div className="px-4 py-1">
      <div onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 relative ${active ? activeCls : hoverCls}`}>
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#6C5CE7] rounded-r-full" />}
        <div className="relative">
          <Avatar user={contact} size="md" />
          {isOnline && !contact.isAI && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-[0_0_6px_rgba(34,197,94,0.5)]" />}
          {contact.isAI && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#6C5CE7] border-2 border-white rounded-full flex items-center justify-center">
            <span className="text-white text-[7px] font-bold">AI</span>
          </div>}
          {contact.isGroup && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[8px]">group</span>
          </div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <span className={`text-sm font-semibold truncate ${textPri}`}>{contact.username}</span>
            {lastMsg && <span className={`text-[10px] ${textSec}`}>{formatTime(lastMsg.createdAt)}</span>}
          </div>
          <div className="flex justify-between items-center">
            <p className={`text-xs truncate pr-2 ${unread > 0 ? "text-[#6C5CE7] font-medium" : textSec}`}>
              {lastMsg ? (lastMsg.type !== "text" && lastMsg.type !== "sticker" ? "Sent a " + lastMsg.type : lastMsg.content) : "Start a conversation"}
            </p>
            {unread > 0 && <div className="w-4 h-4 bg-[#6C5CE7] text-[10px] text-white flex items-center justify-center rounded-full shrink-0">{unread}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Contacts Panel ────────────────────────────────────────────────────────────
function ContactsPanel({ contacts, onStartChat, isOnline }) {
  const { settings } = useAppSettings();
  const isDark    = settings.theme === "dark";
  const panelBg   = isDark ? "bg-[#1a1b23] border-r border-white/5" : "bg-surface-container-lowest";
  const inputBg   = isDark ? "bg-white/10 text-white placeholder:text-white/30" : "bg-surface-container-low";
  const rowHover  = isDark ? "hover:bg-white/8" : "hover:bg-surface-container-low/60";
  const textPri   = isDark ? "text-white"    : "text-on-surface";
  const textSec   = isDark ? "text-white/50" : "text-on-surface-variant";
  const iconCls   = isDark ? "text-white/40" : "text-on-surface-variant";

  const [search, setSearch] = useState("");
  const filtered = contacts.filter(c => c.username.toLowerCase().includes(search.toLowerCase()));
  const online  = filtered.filter(c =>  isOnline(c._id));
  const offline = filtered.filter(c => !isOnline(c._id));

  return (
    <section className={`w-80 h-full flex flex-col transition-colors duration-300 ${panelBg}`} style={{ animation: "slideIn 0.3s ease-out" }}>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <PanelTitle text="Contacts" />
          <span className="text-xs font-semibold bg-[#6C5CE7]/15 text-[#6C5CE7] px-2 py-1 rounded-full">{contacts.length} people</span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <span className={`material-symbols-outlined text-sm ${iconCls}`}>search</span>
          </div>
          <input className={`w-full border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#6C5CE7] outline-none transition-all ${inputBg}`}
            placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
        {online.length > 0 && (<>
          <p className="text-[10px] font-extrabold tracking-widest text-green-500/90 uppercase px-2 mb-2">● Online — {online.length}</p>
          {online.map(c => (
            <div key={c._id} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all group mb-1 ${rowHover}`} onClick={() => onStartChat(c)}>
              <div className="relative"><Avatar user={c} size="md" /><div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" /></div>
              <div className="flex-1 min-w-0"><p className={`text-sm font-semibold ${textPri}`}>{c.username}</p><p className="text-xs text-green-500">Active now</p></div>
              <button onClick={e => { e.stopPropagation(); onStartChat(c); }} className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 bg-[#6C5CE7]/15 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[#6C5CE7] text-sm">chat</span>
              </button>
            </div>
          ))}
        </>)}
        {offline.length > 0 && (<>
          <p className={`text-[10px] font-extrabold tracking-widest uppercase px-2 mb-2 mt-4 ${textSec}`}>Offline — {offline.length}</p>
          {offline.map(c => (
            <div key={c._id} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all group mb-1 ${rowHover}`} onClick={() => onStartChat(c)}>
              <Avatar user={c} size="md" />
              <div className="flex-1 min-w-0"><p className={`text-sm font-semibold ${textPri}`}>{c.username}</p><p className={`text-xs ${textSec}`}>Offline</p></div>
              <button onClick={e => { e.stopPropagation(); onStartChat(c); }} className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 bg-[#6C5CE7]/15 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[#6C5CE7] text-sm">chat</span>
              </button>
            </div>
          ))}
        </>)}
        {filtered.length === 0 && <p className={`text-center text-sm mt-12 ${textSec}`}>No contacts found</p>}
      </div>
    </section>
  );
}

// ── Calls Panel ───────────────────────────────────────────────────────────────
function CallsPanel({ contacts, onCall, isOnline }) {
  const { settings } = useAppSettings();
  const isDark   = settings.theme === "dark";
  const panelBg  = isDark ? "bg-[#1a1b23] border-r border-white/5" : "bg-surface-container-lowest";
  const rowHover = isDark ? "hover:bg-white/8"  : "hover:bg-surface-container-low/60";
  const tabBg    = isDark ? "bg-white/8"         : "bg-surface-container-low";
  const textPri  = isDark ? "text-white"         : "text-on-surface";
  const textSec  = isDark ? "text-white/50"      : "text-on-surface-variant";
  const [tab, setTab] = useState("recent");
  const callLog = [
    { id:1, direction:"incoming", duration:"5:23",  time:new Date(Date.now()-7200000) },
    { id:2, direction:"outgoing", duration:"2:10",  time:new Date(Date.now()-18000000) },
    { id:3, direction:"missed",   duration:null,    time:new Date(Date.now()-86400000) },
    { id:4, direction:"incoming", duration:"12:05", time:new Date(Date.now()-172800000) },
  ];
  const dirIcon  = { incoming:"call_received", outgoing:"call_made", missed:"call_missed" };
  const dirColor = { incoming:"text-green-500", outgoing:"text-blue-400", missed:"text-red-400" };

  return (
    <section className={`w-80 h-full flex flex-col transition-colors duration-300 ${panelBg}`} style={{ animation: "slideIn 0.3s ease-out" }}>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <PanelTitle text="Calls" />
          <div className={`flex items-center gap-1 rounded-full p-1 ${tabBg}`}>
            {["recent","contacts"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${tab===t ? "bg-[#6C5CE7] text-white shadow-sm" : isDark ? "text-white/50 hover:text-white" : "text-on-surface-variant hover:text-on-surface"}`}>
                {t[0].toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
        {tab==="recent" ? (<>
          <p className={`text-[10px] font-extrabold tracking-widest uppercase px-2 mb-3 ${textSec}`}>Recent calls</p>
          {callLog.map((call,i) => {
            const c = contacts[i%Math.max(contacts.length,1)];
            if(!c) return null;
            return (
              <div key={call.id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all group mb-1 ${rowHover}`}>
                <div className="relative"><Avatar user={c} size="md" />{isOnline(c._id)&&<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${textPri}`}>{c.username}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-xs ${dirColor[call.direction]}`}>{dirIcon[call.direction]}</span>
                    <span className={`text-xs ${call.direction==="missed"?"text-red-400":textSec}`}>{call.direction} · {call.duration||"Missed"} · {timeAgo(call.time)}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onCall(c,"voice")} className="w-8 h-8 bg-green-500/15 text-green-500 rounded-full flex items-center justify-center hover:bg-green-500/25"><span className="material-symbols-outlined text-sm">call</span></button>
                  <button onClick={() => onCall(c,"video")} className="w-8 h-8 bg-[#6C5CE7]/15 text-[#6C5CE7] rounded-full flex items-center justify-center hover:bg-[#6C5CE7]/25"><span className="material-symbols-outlined text-sm">videocam</span></button>
                </div>
              </div>
            );
          })}
        </>) : (<>
          <p className={`text-[10px] font-extrabold tracking-widest uppercase px-2 mb-3 ${textSec}`}>Call a contact</p>
          {contacts.map(c => (
            <div key={c._id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all group mb-1 ${rowHover}`}>
              <div className="relative"><Avatar user={c} size="md" />{isOnline(c._id)&&<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}</div>
              <div className="flex-1 min-w-0"><p className={`text-sm font-semibold ${textPri}`}>{c.username}</p><p className={`text-xs ${isOnline(c._id)?"text-green-500":textSec}`}>{isOnline(c._id)?"Online":"Offline"}</p></div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onCall(c,"voice")} className="w-8 h-8 bg-green-500/15 text-green-500 rounded-full flex items-center justify-center hover:bg-green-500/25"><span className="material-symbols-outlined text-sm">call</span></button>
                <button onClick={() => onCall(c,"video")} className="w-8 h-8 bg-[#6C5CE7]/15 text-[#6C5CE7] rounded-full flex items-center justify-center hover:bg-[#6C5CE7]/25"><span className="material-symbols-outlined text-sm">videocam</span></button>
              </div>
            </div>
          ))}
        </>)}
      </div>
    </section>
  );
}

// ── Stories Panel ─────────────────────────────────────────────────────────────
const STORY_COLORS = ["from-pink-400 to-purple-600","from-orange-400 to-pink-500","from-blue-400 to-cyan-500","from-green-400 to-teal-500","from-yellow-400 to-orange-500","from-purple-400 to-indigo-600"];
const STORY_TEXTS  = ["Just shipped a new feature! 🚀","Coffee & code ☕","Beautiful day outside 🌤️","Working on something big... 👀","Team lunch was amazing 🍕","Weekend vibes ✨"];

function StoriesPanel({ contacts, currentUser }) {
  const { settings } = useAppSettings();
  const isDark    = settings.theme === "dark";
  const panelBg   = isDark ? "bg-[#1a1b23] border-r border-white/5" : "bg-surface-container-lowest";
  const rowHover  = isDark ? "hover:bg-white/8"  : "hover:bg-surface-container-low/60";
  const addBoxBg  = isDark ? "bg-white/8"         : "bg-surface-container-low";
  const textPri   = isDark ? "text-white"         : "text-on-surface";
  const textSec   = isDark ? "text-white/50"      : "text-on-surface-variant";
  const inputCls  = isDark ? "text-white placeholder:text-white/30" : "text-on-surface placeholder:text-on-surface-variant/50";
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [myStory, setMyStory] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [storyText, setStoryText] = useState("");
  const stories = contacts.map((c,i) => ({ user:c, text:STORY_TEXTS[i%STORY_TEXTS.length], color:STORY_COLORS[i%STORY_COLORS.length], time:new Date(Date.now()-Math.random()*72000000), views:Math.floor(Math.random()*50+5) }));

  useEffect(() => {
    if(!selectedStory) return;
    setStoryProgress(0);
    const iv = setInterval(() => setStoryProgress(p => { if(p>=100){setSelectedStory(null);return 0;} return p+2; }), 100);
    return () => clearInterval(iv);
  },[selectedStory]);

  const postStory = () => { if(!storyText.trim()) return; setMyStory({text:storyText,time:new Date(),color:STORY_COLORS[0]}); setStoryText(""); setAddOpen(false); };

  return (
    <section className={`w-80 h-full flex flex-col transition-colors duration-300 ${panelBg}`} style={{ animation: "slideIn 0.3s ease-out" }}>
      {selectedStory && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setSelectedStory(null)}>
          <div className={`w-80 h-[520px] rounded-3xl bg-gradient-to-b ${selectedStory.color} relative overflow-hidden shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="absolute top-3 left-3 right-3 h-0.5 bg-white/30 rounded-full z-10"><div className="h-full bg-white rounded-full transition-all" style={{width:storyProgress+"%"}} /></div>
            <div className="absolute top-8 left-4 right-4 flex items-center gap-2 z-10">
              <Avatar user={selectedStory.user} size="sm" />
              <div><p className="text-white font-semibold text-sm">{selectedStory.user.username}</p><p className="text-white/70 text-[10px]">{timeAgo(selectedStory.time)}</p></div>
              <button onClick={() => setSelectedStory(null)} className="ml-auto text-white/80 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex items-center justify-center h-full px-6"><p className="text-white text-xl font-bold text-center leading-relaxed">{selectedStory.text}</p></div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-1 text-white/70"><span className="material-symbols-outlined text-sm">visibility</span><span className="text-xs">{selectedStory.views} views</span></div>
              <button className="bg-white/20 text-white px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur">Reply</button>
            </div>
          </div>
        </div>
      )}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <PanelTitle text="Stories" />
          <button onClick={() => setAddOpen(true)} className="w-8 h-8 bg-[#6C5CE7]/15 text-[#6C5CE7] rounded-full flex items-center justify-center hover:bg-[#6C5CE7]/25 transition-colors"><span className="material-symbols-outlined text-sm">add</span></button>
        </div>
        {addOpen && (
          <div className={`mb-4 p-3 rounded-2xl ${addBoxBg}`} style={{ animation: "fadeUp 0.2s ease-out" }}>
            <textarea className={`w-full bg-transparent text-sm outline-none resize-none ${inputCls}`} placeholder="What's on your mind?" rows={3} value={storyText} onChange={e => setStoryText(e.target.value)} />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setAddOpen(false)} className={`text-xs ${textSec} hover:text-[#6C5CE7]`}>Cancel</button>
              <button onClick={postStory} className="text-xs bg-[#6C5CE7] text-white px-3 py-1.5 rounded-full font-semibold hover:bg-[#5849c2]">Post</button>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
        <p className={`text-[10px] font-extrabold tracking-widest uppercase px-2 mb-3 ${textSec}`}>Your story</p>
        <div className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all mb-3 ${rowHover}`} onClick={() => myStory && setSelectedStory({user:{username:"You",avatar:currentUser?.avatar},...myStory})}>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#a19afd] flex items-center justify-center">{myStory?<Avatar user={currentUser} size="md"/>:<span className="material-symbols-outlined text-white text-xl">add</span>}</div>
            {!myStory && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#6C5CE7] rounded-full border-2 border-white flex items-center justify-center"><span className="material-symbols-outlined text-white text-[10px]">add</span></div>}
          </div>
          <div><p className={`text-sm font-semibold ${textPri}`}>Add to story</p><p className={`text-xs ${textSec}`}>{myStory?"Posted "+timeAgo(myStory.time):"Share a moment"}</p></div>
        </div>
        <p className={`text-[10px] font-extrabold tracking-widest uppercase px-2 mb-3 ${textSec}`}>Recent</p>
        {stories.map((story,i) => (
          <div key={story.user._id} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all group mb-1 ${rowHover}`} style={{animation:`fadeUp ${0.1+i*0.05}s ease-out`}} onClick={() => setSelectedStory(story)}>
            <div className="p-0.5 rounded-2xl shrink-0" style={{background:"linear-gradient(135deg,#6C5CE7,#a19afd,#f472b6)"}}><Avatar user={story.user} size="md" /></div>
            <div className="flex-1 min-w-0"><p className={`text-sm font-semibold ${textPri}`}>{story.user.username}</p><p className={`text-xs truncate ${textSec}`}>{story.text}</p></div>
            <span className={`text-[10px] shrink-0 ${textSec}`}>{timeAgo(story.time)}</span>
          </div>
        ))}
        {contacts.length===0 && <div className="text-center py-12"><span className={`material-symbols-outlined text-4xl opacity-40 ${textSec}`}>amp_stories</span><p className={`text-sm mt-2 ${textSec}`}>No stories yet</p></div>}
      </div>
    </section>
  );
}

// ── Feature 4: AI Bot Panel ────────────────────────────────────────────────────
function AIBotPanel({ isDark, textPrimary, textSecondary }) {
  const [aiMessages, setAiMessages] = useState([
    { id: 1, role: "assistant", content: "Hi! I'm ChatVerse AI 🤖 Ask me anything — I can help you draft messages, answer questions, translate text, or just have a chat!" }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiBottomRef = useRef(null);

  useEffect(() => { aiBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  const sendToAI = async () => {
    const q = aiInput.trim();
    if (!q || aiLoading) return;
    setAiInput("");
    const userMsg = { id: Date.now(), role: "user", content: q };
    setAiMessages(prev => [...prev, userMsg]);
    setAiLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are ChatVerse AI, a helpful assistant built into a chat application. Be friendly, concise, and useful. Keep responses short and conversational unless asked for detail.",
          messages: [
            ...aiMessages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: q }
          ]
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't process that.";
      setAiMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: reply }]);
    } catch {
      setAiMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: "⚠️ Connection error. Please try again." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const panelBg = isDark ? "bg-[#1a1b23] border-r border-white/5" : "bg-surface-container-lowest";
  const inputBg = isDark ? "bg-white/10 text-white placeholder:text-white/30" : "bg-surface-container-low";

  return (
    <section className={`w-80 h-full flex flex-col transition-colors duration-300 ${panelBg}`} style={{ animation: "slideIn 0.3s ease-out" }}>
      {/* Header */}
      <div className="px-6 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#a19afd] flex items-center justify-center shadow-lg shadow-[#6C5CE7]/30">
            <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold" style={{ background:"linear-gradient(135deg,#6C5CE7,#a19afd)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              ChatVerse AI
            </h1>
            <p className={`text-[10px] ${isDark ? "text-white/40" : "text-on-surface-variant"}`}>Always online · Powered by Claude</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-2 flex flex-col gap-3">
        {aiMessages.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#a19afd] flex items-center justify-center shrink-0 mt-1">
                <span className="material-symbols-outlined text-white text-xs">smart_toy</span>
              </div>
            )}
            <div className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user"
              ? "text-white rounded-br-sm" : isDark ? "bg-white/10 text-white rounded-bl-sm" : "bg-white text-on-surface shadow-sm rounded-bl-sm"}`}
              style={m.role === "user" ? { background:"linear-gradient(135deg,#6C5CE7,#a19afd)" } : {}}>
              {m.content}
            </div>
          </div>
        ))}
        {aiLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#a19afd] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-xs">smart_toy</span>
            </div>
            <div className={`px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 ${isDark ? "bg-white/10" : "bg-white shadow-sm"}`}>
              {[0,1,2].map(i => <span key={i} className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark?"bg-white/40":"bg-[#6C5CE7]/40"}`} style={{animationDelay:i*0.15+"s"}} />)}
            </div>
          </div>
        )}
        <div ref={aiBottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2 flex gap-1.5 flex-wrap shrink-0">
        {["Draft a message", "Translate text", "Summarize chat", "Fun fact"].map(p => (
          <button key={p} onClick={() => { setAiInput(p); }}
            className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${isDark?"border-white/10 text-white/50 hover:bg-white/10":"border-outline-variant text-on-surface-variant hover:bg-surface-container"}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className={`p-3 border-t flex items-center gap-2 shrink-0 ${isDark?"border-white/5":"border-outline-variant/20"}`}>
        <input
          className={`flex-1 rounded-full py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-[#6C5CE7] border-none transition-all ${inputBg}`}
          placeholder="Ask anything..."
          value={aiInput} onChange={e => setAiInput(e.target.value)}
          onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendToAI();} }} />
        <button onClick={sendToAI} disabled={!aiInput.trim() || aiLoading}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
          style={{ background:"linear-gradient(135deg,#6C5CE7,#a19afd)" }}>
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </div>
    </section>
  );
}

// ── Profile Preview Panel (right side when settings tab is active) ────────────
function ProfilePreviewPanel({ isDark, textPrimary, textSecondary, chatBg, user, settings }) {
  const API_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";
  const { updateSetting, updateMany } = useAppSettings();
  const { token } = useAuth();

  const [avatarSrc, setAvatarSrc]       = useState(settings.avatarUrl || (user?.avatar ? `${API_URL}${user.avatar}` : null));
  const [uploading, setUploading]       = useState(false);
  const [displayName, setDisplayName]   = useState(settings.displayName || user?.username || "");
  const [bio, setBio]                   = useState(settings.bio || "");
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [hoverAvatar, setHoverAvatar]   = useState(false);
  const fileRef = useRef(null);

  // Keep local state in sync if settings change externally
  useEffect(() => {
    if (settings.avatarUrl) setAvatarSrc(settings.avatarUrl);
  }, [settings.avatarUrl]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setAvatarSrc(blobUrl);
    updateSetting("avatarUrl", blobUrl); // sidebar updates immediately
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await axios.put(`${API_URL}/api/users/avatar`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const serverPath = res.data?.avatar || res.data?.user?.avatar;
      if (serverPath) {
        const serverUrl = `${API_URL}${serverPath}`;
        setAvatarSrc(serverUrl);
        updateSetting("avatarUrl", serverUrl);
      }
    } catch { /* keep blob preview */ }
    finally { setUploading(false); }
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      updateMany({ displayName, bio });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const initial = (displayName || user?.username || "?")[0].toUpperCase();

  const inputStyle = {
    width: "100%",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 13,
    outline: "none",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)"}`,
    background: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
    color: isDark ? "#ffffff" : "#1a1b23",
    transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
    fontFamily: "inherit",
  };
  const labelStyle = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 6,
    color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)",
  };
  const counterStyle = {
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
    color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)",
  };

  return (
    <section className={`flex-1 h-full flex flex-col items-center justify-center gap-0 relative overflow-hidden transition-colors duration-300 ${chatBg}`}>

      <style>{`
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes avatarPulse{ 0%,100%{transform:scale(1);opacity:.35} 50%{transform:scale(1.04);opacity:.7} }
        @keyframes saveFlash  { 0%{transform:scale(.95)} 60%{transform:scale(1.04)} 100%{transform:scale(1)} }
        .profile-input::placeholder { color: ${isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}; }
      `}</style>

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(108,92,231,0.06) 0%, transparent 65%)" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-8"
        style={{ animation: "fadeUp 0.4s ease-out" }}>

        {/* ── Avatar ─────────────────────────────────────────────────── */}
        <div className="relative mb-7"
          onMouseEnter={() => setHoverAvatar(true)}
          onMouseLeave={() => setHoverAvatar(false)}
          onClick={() => fileRef.current?.click()}
          style={{ cursor: "pointer" }}>

          {/* Spinning gradient ring */}
          <div className="absolute rounded-full"
            style={{
              width: 210, height: 210, top: -7, left: -7,
              background: "conic-gradient(from 0deg, #6C5CE7, #00d4ff, #a29bfe, #6C5CE7)",
              animation: "spin 6s linear infinite",
              borderRadius: "50%",
              padding: 3,
              opacity: hoverAvatar ? 1 : 0.7,
              transition: "opacity 0.3s",
            }}>
            <div className="w-full h-full rounded-full"
              style={{ background: isDark ? "#13141c" : "#f0eeff" }} />
          </div>

          {/* Pulse ring */}
          <div className="absolute rounded-full"
            style={{ width: 204, height: 204, top: -4, left: -4, border: "2px solid rgba(108,92,231,0.25)", animation: "avatarPulse 2.5s ease-in-out infinite" }} />

          {/* Photo */}
          <div className="rounded-full overflow-hidden"
            style={{ width: 196, height: 196, boxShadow: "0 0 40px rgba(108,92,231,0.3), 0 16px 48px rgba(0,0,0,0.4)" }}>
            {avatarSrc
              ? <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover"
                  style={{ filter: hoverAvatar ? "brightness(0.65)" : "brightness(1)", transition: "filter 0.25s" }} />
              : <div className="w-full h-full flex items-center justify-center font-black"
                  style={{ background: "linear-gradient(135deg,#6C5CE7,#a29bfe)", fontSize: 68, color: "#fff",
                    filter: hoverAvatar ? "brightness(0.65)" : "brightness(1)", transition: "filter 0.25s" }}>
                  {initial}
                </div>
            }
          </div>

          {/* Hover overlay */}
          {hoverAvatar && (
            <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1 pointer-events-none"
              style={{ zIndex: 5 }}>
              <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
              <span className="text-white text-xs font-semibold">Change Photo</span>
            </div>
          )}

          {/* Uploading spinner */}
          {uploading && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.55)", zIndex: 6 }}>
              <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {/* Online dot */}
          <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 bg-green-500"
            style={{ borderColor: isDark ? "#13141c" : "#f0eeff", boxShadow: "0 0 10px rgba(34,197,94,0.7)", zIndex: 7 }} />

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* ── Tap hint ────────────────────────────────────────────────── */}
        <p className={`text-xs mb-6 ${isDark ? "text-white/30" : "text-on-surface-variant/50"}`}>
          Tap photo to change
        </p>

        {/* ── Display Name ─────────────────────────────────────────────── */}
        <div className="w-full mb-4">
          <label style={labelStyle}>Display Name</label>
          <input
            className="profile-input"
            style={inputStyle}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={user?.username || "Your name"}
            onFocus={e => {
              e.target.style.borderColor = "#6C5CE7";
              e.target.style.boxShadow   = "0 0 0 3px rgba(108,92,231,0.15)";
              e.target.style.background  = isDark ? "rgba(108,92,231,0.1)" : "#f5f3ff";
            }}
            onBlur={e => {
              e.target.style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)";
              e.target.style.boxShadow   = "none";
              e.target.style.background  = isDark ? "rgba(255,255,255,0.06)" : "#ffffff";
            }}
          />
        </div>

        {/* ── Bio ──────────────────────────────────────────────────────── */}
        <div className="w-full mb-6">
          <label style={labelStyle}>Bio</label>
          <textarea
            className="profile-input"
            style={{ ...inputStyle, resize: "none" }}
            rows={3}
            maxLength={120}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell people about yourself..."
            onFocus={e => {
              e.target.style.borderColor = "#6C5CE7";
              e.target.style.boxShadow   = "0 0 0 3px rgba(108,92,231,0.15)";
              e.target.style.background  = isDark ? "rgba(108,92,231,0.1)" : "#f5f3ff";
            }}
            onBlur={e => {
              e.target.style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)";
              e.target.style.boxShadow   = "none";
              e.target.style.background  = isDark ? "rgba(255,255,255,0.06)" : "#ffffff";
            }}
          />
          <p style={counterStyle}>{bio.length}/120</p>
        </div>

        {/* ── Save button ───────────────────────────────────────────────── */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{
            background: saved ? "#22c55e" : "linear-gradient(135deg,#6C5CE7,#a29bfe)",
            boxShadow: saved ? "0 4px 20px rgba(34,197,94,0.35)" : "0 4px 20px rgba(108,92,231,0.35)",
            animation: saved ? "saveFlash 0.4s ease-out" : "none",
            transition: "background 0.3s, box-shadow 0.3s",
          }}>
          {saving
            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg> Saving...</>
            : saved
            ? <><span className="material-symbols-outlined text-sm">check_circle</span> Saved!</>
            : "Save Profile"
          }
        </button>

        {/* Email display */}
        {user?.email && (
          <p className={`text-xs mt-4 ${isDark ? "text-white/20" : "text-on-surface-variant/40"}`}>
            {user.email}
          </p>
        )}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN CHAT PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function ChatPage() {
  const { user, logout } = useAuth();
  const { socket, isOnline: isOnlineRaw, incomingCall, setIncomingCall } = useSocket();
  const { settings, updateSetting } = useAppSettings();

  const isOnline = (uid) => isOnlineRaw(uid);

  const isDark        = settings.theme === "dark";
  const bg            = isDark ? "bg-[#0f0f13]"  : "bg-background";
  const panelBg       = isDark ? "bg-[#1a1b23]"  : "bg-surface-container-lowest";
  const chatBg        = isDark ? "bg-[#13141c]"  : "bg-surface-container-low";
  const headerBg      = isDark ? "bg-[#1a1b23]/90 border-b border-white/5" : "bg-white/80";
  const textPrimary   = isDark ? "text-white"     : "text-on-surface";
  const textSecondary = isDark ? "text-white/50"  : "text-on-surface-variant";
  const compact       = settings.compactMode;
  const chatBackground = isDark ? DARK_BG : LIGHT_BG;

  // Core state
  const [contacts, setContacts]           = useState([]);
  const [groups, setGroups]               = useState([]);
  const [search, setSearch]               = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages]           = useState([]);
  const [text, setText]                   = useState("");
  const [typing, setTyping]               = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [unreadMap, setUnreadMap]         = useState({});
  const [lastMsgMap, setLastMsgMap]       = useState({});
  const [activeTab, setActiveTab]         = useState("chats");
  const [callData, setCallData]           = useState(null);
  const [incomingCallAnswered, setIncomingCallAnswered] = useState(null);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [mediaRecorder, setMediaRecorder]   = useState(null);

  // New feature state
  const [showEmojiPicker, setShowEmojiPicker]     = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [replyTo, setReplyTo]                     = useState(null);
  const [reactions, setReactions]                 = useState({});
  const [showGroupModal, setShowGroupModal]        = useState(false);
  const [showVirtualBg, setShowVirtualBg]         = useState(false);
  const [panelWidth, setPanelWidth]               = useState(320); // Fix 2: resizable panel

  const bottomRef    = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimer  = useRef(null);
  const dragRef      = useRef(null); // Fix 2: drag handle ref
  const audioChunks  = useRef([]);

  // Fix 2: drag-to-resize panel
  const startDrag = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    const onMove = (me) => {
      const newW = Math.min(480, Math.max(240, startW + me.clientX - startX));
      setPanelWidth(newW);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const emojis = ["😀","😂","😍","🥰","😎","🤔","👍","❤️","🔥","✨","🎉","🙏","😭","🥺","💯","🎨","🚀","💜"];

  useEffect(() => {
    axios.get("/api/users").then(r => setContacts(r.data.users));
    axios.get("/api/messages/unread/count").then(r => {
      const m = {}; r.data.counts.forEach(c => { m[c._id] = c.count; }); setUnreadMap(m);
    });
    // Seed sidebar avatar from server profile on first load if not already saved in settings
    if (!settings.avatarUrl && user?.avatar) {
      updateSetting("avatarUrl", `${API}${user.avatar}`);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if(!search){setSearchResults([]);return;}
    const t = setTimeout(() => axios.get("/api/users?search="+search).then(r => setSearchResults(r.data.users)), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if(!activeContact || activeContact.isAI) return;
    axios.get("/api/messages/"+activeContact._id).then(r => {
      setMessages(r.data.messages);
      setUnreadMap(prev => ({...prev,[activeContact._id]:0}));
      socket?.emit("markRead",{senderId:activeContact._id});
    });
  },[activeContact]); // eslint-disable-line

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  useEffect(() => {
    if(!socket) return;
    socket.on("receiveMessage", msg => {
      const sid = msg.sender._id||msg.sender;
      if(activeContact&&sid===activeContact._id){setMessages(prev=>[...prev,msg]);socket.emit("markRead",{senderId:sid});}
      else setUnreadMap(prev=>({...prev,[sid]:(prev[sid]||0)+1}));
      setLastMsgMap(prev=>({...prev,[sid]:msg}));
    });
    socket.on("messageSent", msg => {
      setMessages(prev=>prev.find(m=>m._id===msg._id)?prev:[...prev,msg]);
      const rid=msg.receiver._id||msg.receiver;
      setLastMsgMap(prev=>({...prev,[rid]:msg}));
    });
    socket.on("userTyping",({userId:uid,isTyping:t})=>{if(activeContact&&uid===activeContact._id)setPartnerTyping(t);});
    return ()=>{socket.off("receiveMessage");socket.off("messageSent");socket.off("userTyping");};
  },[socket,activeContact]);

  const handleTextChange = e => {
    setText(e.target.value);
    if(!activeContact) return;
    if(!typing){setTyping(true);socket?.emit("typing",{receiverId:activeContact._id,isTyping:true});}
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(()=>{setTyping(false);socket?.emit("typing",{receiverId:activeContact._id,isTyping:false});},1500);
  };

  const sendMessage = useCallback(() => {
    if(!text.trim()||!activeContact) return;
    const msgData = { receiverId: activeContact._id, content: text, type: "text" };
    // Attach full reply snapshot — saved to DB and forwarded to receiver
    if (replyTo) {
      msgData.replyTo = {
        messageId:  replyTo.messageId  || replyTo._id || "",
        content:    replyTo.content    || "",
        type:       replyTo.type       || "text",
        senderName: replyTo.senderName || "",
      };
    }
    socket?.emit("sendMessage", msgData);
    setText(""); setReplyTo(null);
    socket?.emit("typing", { receiverId: activeContact._id, isTyping: false });
  }, [text, activeContact, socket, replyTo]);

  const handleKeyDown = e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} };

  const uploadFile = async file => {
    if(!activeContact||!file) return;
    const fd = new FormData(); fd.append("file",file); fd.append("receiverId",activeContact._id);
    try {
      const res = await axios.post("/api/messages/upload",fd,{headers:{"Content-Type":"multipart/form-data"}});
      const msg = res.data.message;
      socket?.emit("sendMessage",{receiverId:activeContact._id,content:msg.content,type:msg.type,fileUrl:msg.fileUrl,fileName:msg.fileName,fileSize:msg.fileSize});
    } catch(err){alert("Upload failed: "+(err.response?.data?.message||err.message));}
  };

  const handleFileSelect = e => { const f=e.target.files[0]; if(f) uploadFile(f); e.target.value=""; };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      const mr = new MediaRecorder(stream); audioChunks.current=[];
      mr.ondataavailable = e => audioChunks.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(audioChunks.current,{type:"audio/webm"});
        stream.getTracks().forEach(t=>t.stop());
        await uploadFile(new File([blob],"voice-"+Date.now()+".webm",{type:"audio/webm"}));
      };
      mr.start(); setMediaRecorder(mr); setRecordingVoice(true);
    } catch { alert("Microphone access denied"); }
  };
  const stopVoiceRecording = () => { mediaRecorder?.stop(); setRecordingVoice(false); setMediaRecorder(null); };

  // Feature 1: React to message
  const handleReaction = (msgId, emoji) => {
    setReactions(prev => {
      const existing = prev[msgId] || [];
      const alreadyReacted = existing.find(r => r.userId===user._id&&r.emoji===emoji);
      if(alreadyReacted) return {...prev,[msgId]:existing.filter(r=>!(r.userId===user._id&&r.emoji===emoji))};
      return {...prev,[msgId]:[...existing,{emoji,userId:user._id}]};
    });
  };

  // Feature 5: Send sticker
  const sendSticker = sticker => {
    if(!activeContact) return;
    socket?.emit("sendMessage",{receiverId:activeContact._id,content:sticker.emoji,type:"sticker"});
  };

  // Feature 8: Create group
  const createGroup = (name, memberIds) => {
    const groupContact = {
      _id: "group-"+Date.now(),
      username: name,
      avatar: null,
      isGroup: true,
      members: memberIds,
    };
    setGroups(prev => [...prev, groupContact]);
    setActiveContact(groupContact);
    setActiveTab("chats");
    setShowGroupModal(false);
  };

  const startCall = (contact, type) => {
    setActiveContact(contact);
    setCallData({userId:contact._id,myId:user._id,callType:type,name:contact.username});
    setActiveTab("chats");
  };

  const handleAcceptCall = () => { setIncomingCallAnswered({...incomingCall}); setIncomingCall(null); };
  const handleRejectCall = () => { socket?.emit("rejectCall",{to:incomingCall.from}); setIncomingCall(null); };

  // Chats list = groups + real contacts only. AI Bot lives only in its own panel.
  const allChatsContacts = [...groups, ...contacts.filter(c=>c._id!==user?._id)];
  const displayContacts  = search ? searchResults : allChatsContacts;
  const totalUnread      = Object.values(unreadMap).reduce((a,b)=>a+b,0);

  const navItems = [
    { key:"chats",    icon:"chat_bubble",  label:"Chats",    badge:totalUnread },
    { key:"contacts", icon:"group",        label:"Contacts" },
    { key:"calls",    icon:"call",         label:"Calls" },
    { key:"stories",  icon:"amp_stories",  label:"Stories" },
  ];

  return (
    <div className={`${bg} text-on-surface h-screen overflow-hidden flex transition-colors duration-300`}>
      {/* Real WebRTC Call Modal */}
      {callData && <CallModal callData={callData} onEnd={() => setCallData(null)} isIncoming={false} />}
      {incomingCallAnswered && <CallModal callData={incomingCallAnswered} onEnd={() => setIncomingCallAnswered(null)} isIncoming={true} />}
      {incomingCall&&!incomingCallAnswered&&<IncomingCallAlert callData={incomingCall} onAccept={handleAcceptCall} onReject={handleRejectCall} />}
      {showGroupModal && <CreateGroupModal contacts={contacts.filter(c=>c._id!==user?._id)} onClose={()=>setShowGroupModal(false)} onCreate={createGroup} isDark={isDark} />}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`fixed left-0 top-0 h-full z-50 w-16 flex flex-col items-center py-5 transition-colors duration-300 ${isDark?"bg-[#111218] border-r border-white/5":"bg-surface-container-lowest"}`}>

        {/* Profile button at top — reflects avatar from settings or server */}
        <button onClick={()=>setActiveTab("settings")} title="My Profile"
          className="mb-6 relative group shrink-0">
          {(settings.avatarUrl || user?.avatar) ? (
            <img
              src={settings.avatarUrl || (user?.avatar ? API + user.avatar : null)}
              alt="profile"
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-[#6C5CE7]/40 group-hover:ring-[#6C5CE7] transition-all shadow-lg"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#a19afd] flex items-center justify-center font-bold text-white text-base shadow-lg ring-2 ring-[#6C5CE7]/40 group-hover:ring-[#6C5CE7] transition-all">
              {user?.username?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          {/* Online dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
        </button>

        <nav className="flex flex-col gap-5 flex-1 items-center">
          {navItems.map(item => (
            <button key={item.key} onClick={()=>setActiveTab(item.key)} title={item.label}
              className={"relative transition-all scale-95 active:scale-90 "+(activeTab===item.key
                ?"text-[#6C5CE7] before:content-[''] before:absolute before:-left-5 before:w-1 before:h-6 before:bg-[#6C5CE7] before:rounded-r-full"
                :(isDark?"text-white/30 hover:text-[#6C5CE7]":"text-slate-400 hover:text-[#6C5CE7]")+" duration-200")}>
              <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              {item.badge>0&&<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{item.badge>9?"9+":item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom nav: Group + AI + Settings — above avatar */}
        <div className="flex flex-col items-center gap-4 mt-auto mb-4">
          {/* Feature 8: Create Group button */}
          <button onClick={()=>setShowGroupModal(true)} title="Create Group"
            className={`relative transition-all scale-95 active:scale-90 ${isDark?"text-white/30 hover:text-[#6C5CE7]":"text-slate-400 hover:text-[#6C5CE7]"} duration-200`}>
            <span className="material-symbols-outlined text-2xl">group_add</span>
          </button>

          {/* Feature 4: AI Bot */}
          <button onClick={()=>setActiveTab("ai")} title="ChatVerse AI"
            className={"relative transition-all scale-95 active:scale-90 "+(activeTab==="ai"
              ?"text-[#6C5CE7] before:content-[''] before:absolute before:-left-5 before:w-1 before:h-6 before:bg-[#6C5CE7] before:rounded-r-full"
              :(isDark?"text-white/30 hover:text-[#6C5CE7]":"text-slate-400 hover:text-[#6C5CE7]")+" duration-200")}>
            <span className="material-symbols-outlined text-2xl">smart_toy</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_4px_rgba(34,197,94,0.8)]" />
          </button>

          {/* Settings */}
          <button onClick={()=>setActiveTab("settings")} title="Settings"
            className={"relative transition-all scale-95 active:scale-90 "+(activeTab==="settings"
              ?"text-[#6C5CE7] before:content-[''] before:absolute before:-left-5 before:w-1 before:h-6 before:bg-[#6C5CE7] before:rounded-r-full"
              :(isDark?"text-white/30 hover:text-[#6C5CE7]":"text-slate-400 hover:text-[#6C5CE7]")+" duration-200")}>
            <span className="material-symbols-outlined text-2xl">settings</span>
          </button>
        </div>

      </aside>

      {/* ── Main shell ───────────────────────────────────────────────────── */}
      <main className="ml-16 flex w-full h-full overflow-hidden">

        {/* Chats list — resizable panel */}
        {activeTab==="chats" && (
          <section className={`h-full flex flex-col transition-colors duration-300 relative ${panelBg}`}
            style={{ width: panelWidth, minWidth: 240, maxWidth: 480, animation:"slideIn 0.3s ease-out", flexShrink: 0 }}>

            {/* Drag handle on right edge */}
            <div onMouseDown={startDrag}
              className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize z-10 group transition-colors
                ${isDark?"hover:bg-[#6C5CE7]/40 active:bg-[#6C5CE7]/60":"hover:bg-[#6C5CE7]/30 active:bg-[#6C5CE7]/50"}`}
              title="Drag to resize" />
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <PanelTitle text="ChatVerse" />
                <button className={`p-2 rounded-full transition-colors ${isDark?"hover:bg-white/10":"hover:bg-surface-container-low"}`}>
                  <span className={`material-symbols-outlined ${textSecondary}`}>edit_square</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <span className={`material-symbols-outlined text-sm ${textSecondary}`}>search</span>
                </div>
                <input className={`w-full border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[#6C5CE7] outline-none transition-all ${isDark?"bg-white/10 text-white placeholder:text-white/30":"bg-surface-container-low"}`}
                  placeholder="Search messages..." value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-6 py-2">
                <span className={`text-[10px] font-extrabold tracking-widest uppercase ${isDark?"text-white/30":"text-on-surface-variant/60"}`}>{search?"Results":"Recent"}</span>
              </div>
              <div className="flex flex-col">
                {displayContacts.map(contact => (
                  <ConversationRow key={contact._id} contact={contact}
                    unread={unreadMap[contact._id]||0}
                    lastMsg={lastMsgMap[contact._id]||null}
                    active={activeContact?._id===contact._id}
                    onClick={()=>{setActiveContact(contact);setSearch("");}}
                    isOnline={isOnline(contact._id)} />
                ))}
                {displayContacts.length===0&&<p className={`text-center text-sm mt-8 px-6 ${textSecondary}`}>{search?"No users found":"No contacts yet"}</p>}
              </div>
            </div>
          </section>
        )}

        {activeTab==="contacts" && <ContactsPanel contacts={contacts.filter(c=>c._id!==user?._id)} onStartChat={c=>{setActiveContact(c);setActiveTab("chats");}} isOnline={isOnline} />}
        {activeTab==="calls"    && <CallsPanel contacts={contacts.filter(c=>c._id!==user?._id)} onCall={startCall} isOnline={isOnline} />}
        {activeTab==="stories"  && <StoriesPanel contacts={contacts.filter(c=>c._id!==user?._id)} currentUser={user} />}
        {activeTab==="settings" && <SettingsPanel user={user} logout={logout} />}
        {/* Feature 4: AI Bot Panel */}
        {activeTab==="ai" && <AIBotPanel isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary} />}

        {/* ── Chat window ──────────────────────────────────────────────── */}
        {activeContact && activeTab==="chats" ? (
          <section className={`flex-1 h-full flex flex-col relative transition-colors duration-300 ${chatBg}`}>

            {/* Header */}
            <header className={`flex items-center justify-between px-6 py-4 backdrop-blur-xl z-20 shadow-[0px_12px_32px_rgba(83,65,205,0.06)] transition-colors duration-300 ${headerBg}`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar user={activeContact} size="sm" />
                  {isOnline(activeContact._id)&&settings.showOnlineStatus&&!activeContact.isAI&&(
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                  )}
                </div>
                <div>
                  <h2 className={`text-sm font-bold ${textPrimary}`}>{activeContact.username}</h2>
                  <span className={`text-[10px] font-medium ${activeContact.isAI?"text-[#6C5CE7]":isOnline(activeContact._id)?"text-green-500":textSecondary}`}>
                    {activeContact.isAI ? "AI Assistant · Always online" :
                     activeContact.isGroup ? `${activeContact.members?.length||0} members` :
                     partnerTyping&&settings.showTypingIndicator ? "typing..." :
                     isOnline(activeContact._id)?"Online":"Offline"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!activeContact.isAI && !activeContact.isGroup && (<>
                  <button onClick={()=>setCallData({userId:activeContact._id,myId:user._id,callType:"video",name:activeContact.username})}
                    className={`p-2 rounded-full transition-all ${isDark?"hover:bg-white/10":"hover:bg-slate-100"}`} title="Video call">
                    <span className="material-symbols-outlined text-[#6C5CE7]">videocam</span>
                  </button>
                  <button onClick={()=>setCallData({userId:activeContact._id,myId:user._id,callType:"voice",name:activeContact.username})}
                    className={`p-2 rounded-full transition-all ${isDark?"hover:bg-white/10":"hover:bg-slate-100"}`} title="Voice call">
                    <span className="material-symbols-outlined text-[#6C5CE7]">call</span>
                  </button>
                </>)}
                <button className={`p-2 rounded-full transition-all ${isDark?"hover:bg-white/10":"hover:bg-slate-100"}`}>
                  <span className={`material-symbols-outlined ${textSecondary}`}>info</span>
                </button>
              </div>
            </header>

            {/* Feature 2: Reply preview bar above input */}
            {replyTo && (
              <div className={`px-6 py-1 ${isDark?"bg-[#1a1b23]/80":"bg-white/80"} backdrop-blur-sm border-b ${isDark?"border-white/5":"border-outline-variant/20"}`}>
                <ReplyPreview msg={replyTo} onClear={()=>setReplyTo(null)} isDark={isDark} />
              </div>
            )}

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col ${compact?"px-4 py-3 gap-2":"px-8 py-6 gap-4"}`}
              style={{background:chatBackground,backgroundSize:"500px 500px"}}>
              <div className="flex justify-center my-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${isDark?"bg-white/10 text-white/40":"bg-surface-container text-on-surface-variant"}`}>Today</span>
              </div>

              {messages.map((msg,i) => {
                const isSent = (msg.sender._id||msg.sender)===user._id;
                const msgReactions = reactions[msg._id]||[];
                return isSent ? (
                  <div key={msg._id||i} className="flex items-end flex-col gap-1 ml-auto max-w-[70%] pr-2" style={{animation:"fadeUp 0.2s ease-out"}}>
                    <MessageBubble msg={msg} isSent={true} isDark={isDark} onReact={handleReaction}
                      onReply={m => setReplyTo({ ...m, messageId: m._id, senderName: user?.username || "You" })}
                      reactions={msgReactions} />
                    <span className={`text-[10px] pr-1 ${textSecondary}`}>
                      {formatTime(msg.createdAt)}
                      {settings.showReadReceipts&&<span className={msg.read?" text-[#6C5CE7]":" opacity-50"}>{msg.read?" ✓✓":" ✓"}</span>}
                    </span>
                  </div>
                ) : (
                  <div key={msg._id||i} className="flex items-start gap-3 max-w-[70%] pl-2" style={{animation:"fadeUp 0.2s ease-out"}}>
                    <Avatar user={activeContact} size="sm" />
                    <div className="flex flex-col gap-1">
                      <MessageBubble msg={msg} isSent={false} isDark={isDark} onReact={handleReaction}
                        onReply={m => setReplyTo({ ...m, messageId: m._id, senderName: activeContact.username })}
                        reactions={msgReactions} />
                      <span className={`text-[10px] pl-1 ${textSecondary}`}>{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}

              {partnerTyping&&settings.showTypingIndicator&&(
                <div className="flex items-center gap-2">
                  <div className={`px-4 py-3 rounded-2xl received-bubble flex gap-1 ${isDark?"bg-white/10":"bg-surface-container-lowest"}`}>
                    {[0,1,2].map(i=><span key={i} className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark?"bg-white/40":"bg-on-surface-variant"}`} style={{animationDelay:i*0.15+"s"}} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Feature 1 & 5: Emoji + Sticker pickers */}
            {showEmojiPicker && (
              <div className={`absolute bottom-20 left-20 rounded-2xl shadow-xl border p-3 z-30 grid grid-cols-9 gap-1 ${isDark?"bg-[#1a1b23] border-white/10":"bg-white border-outline-variant"}`}>
                {emojis.map(e=><button key={e} onClick={()=>{setText(p=>p+e);setShowEmojiPicker(false);}} className={`text-xl p-1.5 rounded-lg transition-colors ${isDark?"hover:bg-white/10":"hover:bg-surface-container"}`}>{e}</button>)}
              </div>
            )}
            {/* Feature 5: Sticker picker */}
            {showStickerPicker && (
              <StickerPicker onSend={sendSticker} onClose={()=>setShowStickerPicker(false)} isDark={isDark} />
            )}

            {/* Input bar */}
            <footer className={`p-4 flex items-center gap-3 relative transition-colors ${isDark?"bg-[#1a1b23] border-t border-white/5":"bg-surface-container-lowest"}`}>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,audio/*,video/*,.zip,.pdf,.doc,.docx" />

              <div className="flex items-center gap-0.5">
                {/* Attach */}
                <button onClick={()=>fileInputRef.current?.click()} title="Attach file"
                  className={`p-2 rounded-full transition-colors group ${isDark?"hover:bg-white/10":"hover:bg-surface-container-low"}`}>
                  <span className={`material-symbols-outlined group-hover:text-[#6C5CE7] ${textSecondary}`}>add_circle</span>
                </button>
                {/* Image */}
                <button onClick={()=>fileInputRef.current?.click()} title="Send image"
                  className={`p-2 rounded-full transition-colors group ${isDark?"hover:bg-white/10":"hover:bg-surface-container-low"}`}>
                  <span className={`material-symbols-outlined group-hover:text-[#6C5CE7] ${textSecondary}`}>image</span>
                </button>
                {/* Emoji */}
                <button onClick={()=>{setShowEmojiPicker(v=>!v);setShowStickerPicker(false);}} title="Emoji"
                  className={`p-2 rounded-full transition-colors group ${isDark?"hover:bg-white/10":"hover:bg-surface-container-low"}`}>
                  <span className={`material-symbols-outlined group-hover:text-[#6C5CE7] ${showEmojiPicker?"text-[#6C5CE7]":textSecondary}`}>mood</span>
                </button>
                {/* Feature 5: Sticker — uses 'kid_star' icon, clearly different from emoji */}
                <button onClick={()=>{setShowStickerPicker(v=>!v);setShowEmojiPicker(false);}} title="Stickers"
                  className={`p-2 rounded-full transition-colors group ${isDark?"hover:bg-white/10":"hover:bg-surface-container-low"}`}>
                  <span className={`material-symbols-outlined group-hover:text-[#6C5CE7] ${showStickerPicker?"text-[#6C5CE7]":textSecondary}`}>kid_star</span>
                </button>
                {/* Voice */}
                <button onMouseDown={startVoiceRecording} onMouseUp={stopVoiceRecording} onTouchStart={startVoiceRecording} onTouchEnd={stopVoiceRecording}
                  title="Hold to record voice"
                  className={`relative p-2 rounded-full transition-colors group ${recordingVoice?"bg-red-50":isDark?"hover:bg-white/10":"hover:bg-surface-container-low"}`}>
                  <span className={`material-symbols-outlined group-hover:text-[#6C5CE7] ${recordingVoice?"text-red-500":textSecondary}`}>{recordingVoice?"radio_button_checked":"mic"}</span>
                  {recordingVoice&&<span className="absolute inset-0 rounded-full animate-ping bg-red-200 opacity-60" />}
                </button>
              </div>

              <div className="flex-1">
                <input
                  className={`w-full border-none rounded-full py-3 px-6 text-sm focus:ring-2 focus:ring-[#6C5CE7] outline-none transition-all ${isDark?"bg-white/10 text-white placeholder:text-white/30":"bg-surface-container-low placeholder:text-on-surface-variant/50"}`}
                  placeholder={recordingVoice?"Recording… release to send":replyTo?"Reply to message...":"Type a message..."}
                  value={text} onChange={handleTextChange} onKeyDown={handleKeyDown} disabled={recordingVoice} />
              </div>

              <button onClick={sendMessage} disabled={!text.trim()}
                className="w-11 h-11 flex items-center justify-center rounded-full text-white shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                style={{background:`linear-gradient(135deg,${settings.accentColor},${settings.accentColor}cc)`,boxShadow:`0 4px 15px ${settings.accentColor}40`}}>
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </footer>
          </section>

        ) : activeTab==="settings" ? (
          /* Settings tab right panel — live profile preview */
          <ProfilePreviewPanel isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary} chatBg={chatBg} user={user} settings={settings} />

        ) : activeTab==="chats" ? (
          <section className={`flex-1 h-full flex flex-col items-center justify-center gap-5 transition-colors ${chatBg}`}>
            <div className="w-24 h-24 rounded-3xl bg-[#6C5CE7]/10 flex items-center justify-center" style={{animation:"glowPulse 2.5s ease-in-out infinite"}}>
              <span className="material-symbols-outlined text-6xl text-[#6C5CE7]">chat_bubble</span>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-extrabold mb-1" style={{background:"linear-gradient(135deg,#6C5CE7,#a19afd)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Welcome to ChatVerse</h2>
              <p className={`text-sm max-w-xs ${textSecondary}`}>Select a contact or start a new group chat</p>
            </div>
            <button onClick={()=>setShowGroupModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
              style={{background:"linear-gradient(135deg,#6C5CE7,#a19afd)"}}>
              <span className="material-symbols-outlined text-sm">group_add</span>
              Create Group Chat
            </button>
          </section>

        ) : (
          <section className={`flex-1 h-full flex flex-col items-center justify-center gap-5 transition-colors ${chatBg}`}>
            <div className="w-20 h-20 rounded-3xl bg-[#6C5CE7]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-[#6C5CE7]">
                {activeTab==="contacts"?"group":activeTab==="calls"?"call":activeTab==="stories"?"amp_stories":activeTab==="ai"?"smart_toy":"settings"}
              </span>
            </div>
            <div className="text-center">
              <h2 className={`text-lg font-bold mb-1 ${textPrimary}`}>
                {activeTab==="contacts"?"Click a contact to chat":activeTab==="calls"?"Hover a contact to call":activeTab==="stories"?"Tap a story to view":activeTab==="ai"?"Chat with AI":"Adjust your preferences"}
              </h2>
              <p className={`text-sm ${textSecondary}`}>Use the panel on the left</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}