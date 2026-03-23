import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Animated starfield canvas ─────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    let W, H;

    const STAR_COUNT = 320;
    const NEBULA_COUNT = 6;
    const stars = [];
    const shootingStars = [];
    let nebulaTime = 0;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Init stars
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 1200,
        z: Math.random() * 1500 + 1,
        size: Math.random() * 1.8 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + Math.random() * 0.025,
        color: Math.random() > 0.85
          ? `hsl(${200 + Math.random()*60},80%,85%)`
          : Math.random() > 0.7
            ? `hsl(${260 + Math.random()*30},60%,90%)`
            : "#ffffff",
      });
    }

    const spawnShootingStar = () => {
      if (shootingStars.length < 3 && Math.random() < 0.008) {
        shootingStars.push({
          x: Math.random() * W,
          y: Math.random() * H * 0.5,
          vx: 6 + Math.random() * 8,
          vy: 2 + Math.random() * 4,
          len: 80 + Math.random() * 120,
          alpha: 1,
          life: 1,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Deep space gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0,   "#00000f");
      bg.addColorStop(0.3, "#050012");
      bg.addColorStop(0.7, "#030018");
      bg.addColorStop(1,   "#000008");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      nebulaTime += 0.003;

      // Nebula clouds
      const nebulas = [
        { cx: W*0.15, cy: H*0.25, rx: W*0.28, ry: H*0.22, h: 260, s: 70, l: 25, a: 0.045 },
        { cx: W*0.85, cy: H*0.15, rx: W*0.22, ry: H*0.18, h: 210, s: 60, l: 20, a: 0.035 },
        { cx: W*0.5,  cy: H*0.6,  rx: W*0.35, ry: H*0.3,  h: 190, s: 50, l: 18, a: 0.03  },
        { cx: W*0.9,  cy: H*0.75, rx: W*0.25, ry: H*0.2,  h: 290, s: 55, l: 22, a: 0.04  },
        { cx: W*0.1,  cy: H*0.8,  rx: W*0.2,  ry: H*0.15, h: 240, s: 45, l: 20, a: 0.03  },
        { cx: W*0.6,  cy: H*0.1,  rx: W*0.3,  ry: H*0.2,  h: 180, s: 65, l: 22, a: 0.038 },
      ];

      nebulas.forEach((n, i) => {
        const pulse = 1 + Math.sin(nebulaTime + i * 1.2) * 0.12;
        const grad = ctx.createRadialGradient(n.cx, n.cy, 0, n.cx, n.cy, Math.max(n.rx, n.ry) * pulse);
        grad.addColorStop(0,   `hsla(${n.h},${n.s}%,${n.l}%,${n.a * 1.8})`);
        grad.addColorStop(0.4, `hsla(${n.h},${n.s}%,${n.l}%,${n.a})`);
        grad.addColorStop(1,   `hsla(${n.h},${n.s}%,${n.l}%,0)`);
        ctx.save();
        ctx.scale(n.rx / Math.max(n.rx, n.ry), n.ry / Math.max(n.rx, n.ry));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.cx / (n.rx / Math.max(n.rx, n.ry)), n.cy / (n.ry / Math.max(n.rx, n.ry)), Math.max(n.rx, n.ry) * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Stars
      stars.forEach(s => {
        s.twinkle += s.twinkleSpeed;
        const alpha = 0.45 + Math.sin(s.twinkle) * 0.55;
        const screenX = (s.x / s.z) * W + W / 2;
        const screenY = (s.y / s.z) * H + H / 2;
        if (screenX < -10 || screenX > W + 10 || screenY < -10 || screenY > H + 10) return;

        // Glow for bright stars
        if (s.size > 1.3) {
          const glow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, s.size * 4);
          glow.addColorStop(0, s.color.replace(")", `,${alpha * 0.6})`).replace("hsl", "hsla").replace("rgb", "rgba") || `rgba(180,180,255,${alpha * 0.4})`);
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(screenX, screenY, s.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, s.size * (1 + Math.sin(s.twinkle) * 0.15), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Shooting stars
      spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx; ss.y += ss.vy; ss.life -= 0.018;
        if (ss.life <= 0) { shootingStars.splice(i, 1); continue; }
        const grad = ctx.createLinearGradient(ss.x - ss.vx * (ss.len / 10), ss.y - ss.vy * (ss.len / 10), ss.x, ss.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, `rgba(180,220,255,${ss.life * 0.9})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5 * ss.life;
        ctx.beginPath();
        ctx.moveTo(ss.x - ss.vx * (ss.len / 10), ss.y - ss.vy * (ss.len / 10));
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}

// ── Floating particle dots ─────────────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[
        { w: 380, h: 380, top: "8%",  left: "5%",  color: "rgba(108,92,231,0.07)", dur: "18s" },
        { w: 280, h: 280, top: "60%", left: "75%", color: "rgba(0,212,255,0.06)",  dur: "24s" },
        { w: 200, h: 200, top: "30%", left: "80%", color: "rgba(160,100,255,0.08)",dur: "15s" },
        { w: 160, h: 160, top: "80%", left: "15%", color: "rgba(0,255,200,0.05)",  dur: "20s" },
      ].map((o, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: o.w, height: o.h, top: o.top, left: o.left,
          background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
          animation: `orbFloat ${o.dur} ease-in-out infinite alternate`,
          animationDelay: `${i * 3}s`,
        }} />
      ))}
      <style>{`
        @keyframes orbFloat {
          0%   { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-40px) scale(1.08); }
        }
      `}</style>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ onGetStarted, onExplore }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(2,0,15,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(108,92,231,0.15)" : "none",
      }}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#6C5CE7,#00d4ff)", boxShadow: "0 0 16px rgba(108,92,231,0.6)" }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>M</span>
        </div>
        <span style={{ fontFamily: "'Orbitron', sans-serif", color: "#00d4ff", fontWeight: 700, fontSize: 15, letterSpacing: 3 }}>
          CHATVERSE
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {["Features", "Community", "AI Avatars", "Pricing"].map(item => (
          <button key={item}
            onClick={item === "Features" ? onExplore : undefined}
            className="text-sm transition-colors duration-200 hover:text-cyan-400"
            style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>
            {item}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onGetStarted}
          className="text-sm px-4 py-2 rounded-full transition-all hover:text-white"
          style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Space Mono', monospace" }}>
          Log In
        </button>
        <button onClick={onGetStarted}
          className="text-sm px-5 py-2 rounded-full font-semibold transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg,#6C5CE7,#00d4ff)",
            color: "#fff",
            fontFamily: "'Space Mono', monospace",
            boxShadow: "0 0 20px rgba(108,92,231,0.4)",
          }}>
          Get Started
        </button>
      </div>
    </nav>
  );
}

// ── Section heading helper ────────────────────────────────────────────────────
function SectionTag({ text }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.9)]" />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 4, color: "#00d4ff", textTransform: "uppercase" }}>
        {text}
      </span>
      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.9)]" />
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent = "#6C5CE7", large = false, visual }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative rounded-3xl p-7 overflow-hidden transition-all duration-500 ${large ? "md:col-span-2" : ""}`}
      style={{
        background: hovered
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? accent + "60" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered ? `0 20px 60px ${accent}20, inset 0 1px 0 rgba(255,255,255,0.08)` : "none",
        transform: hovered ? "translateY(-4px)" : "none",
      }}>
      {/* Corner glow */}
      <div className="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`, opacity: hovered ? 1 : 0 }} />

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}>
          <span className="material-symbols-outlined text-lg" style={{ color: accent }}>{icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-base mb-2" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13 }}>{title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{desc}</p>
        </div>
      </div>

      {visual && (
        <div className="mt-5 rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
          {visual}
        </div>
      )}
    </div>
  );
}

// ── Stat counter ──────────────────────────────────────────────────────────────
function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-black mb-1"
        style={{ fontFamily: "'Orbitron', sans-serif", background: "linear-gradient(135deg,#fff,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {value}
      </div>
      <div className="text-xs tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Space Mono', monospace" }}>{label}</div>
    </div>
  );
}

// ── Main HomePage ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const heroRef  = useRef(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:wght@400;700&display=swap";
    document.head.appendChild(link);
    // Load Material Symbols if not present
    if (!document.querySelector('link[href*="material-symbols"]')) {
      const ms = document.createElement("link");
      ms.rel  = "stylesheet";
      ms.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
      document.head.appendChild(ms);
    }
    setTimeout(() => setHeroVisible(true), 100);
  }, []);

  const goLogin    = () => navigate("/login");
  const goFeatures = () => navigate("/features");

  return (
    <div className="relative min-h-screen"
      style={{ background: "#00000f", color: "#fff", fontFamily: "'Space Mono', monospace", overflowX: "hidden", overflowY: "auto" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body { overflow-x: hidden; overflow-y: auto !important; scroll-behavior: smooth; height: auto !important; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #6C5CE7; border-radius: 2px; }

        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 20px rgba(108,92,231,0.4), 0 0 60px rgba(108,92,231,0.15); }
          50%     { box-shadow: 0 0 40px rgba(108,92,231,0.7), 0 0 100px rgba(108,92,231,0.3); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes gridPulse {
          0%,100% { opacity: 0.03; }
          50%     { opacity: 0.07; }
        }
        @keyframes textShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%     { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes borderRotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0; }
        }

        .hero-title span.shimmer {
          background: linear-gradient(90deg, #6C5CE7, #00d4ff, #a29bfe, #00d4ff, #6C5CE7);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textShimmer 4s linear infinite;
        }

        .grid-overlay {
          background-image:
            linear-gradient(rgba(108,92,231,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108,92,231,0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridPulse 4s ease-in-out infinite;
        }

        .cta-primary {
          background: linear-gradient(135deg, #6C5CE7, #00d4ff);
          border: none;
          color: #fff;
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          letter-spacing: 2px;
          font-size: 13px;
          padding: 14px 36px;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .cta-primary:hover { transform: scale(1.06) translateY(-2px); filter: brightness(1.15); }
        .cta-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .cta-primary:hover::before { transform: translateX(100%); }

        .cta-secondary {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.8);
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          letter-spacing: 2px;
          font-size: 13px;
          padding: 14px 36px;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .cta-secondary:hover {
          border-color: rgba(0,212,255,0.6);
          color: #00d4ff;
          box-shadow: 0 0 20px rgba(0,212,255,0.15);
          transform: translateY(-2px);
        }

        .section-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .section-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .mock-ui {
          background: rgba(10,8,30,0.9);
          border: 1px solid rgba(108,92,231,0.2);
          border-radius: 16px;
          animation: float 6s ease-in-out infinite;
        }

        .pulse-dot {
          width: 8px; height: 8px;
          background: #00d4ff;
          border-radius: 50%;
          box-shadow: 0 0 10px #00d4ff;
          animation: blink 2s ease-in-out infinite;
        }
      `}</style>

      <StarField />
      <FloatingOrbs />

      {/* Grid overlay */}
      <div className="fixed inset-0 grid-overlay pointer-events-none" style={{ zIndex: 1 }} />

      {/* Scanline effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: "2px",
          background: "linear-gradient(transparent, rgba(108,92,231,0.12), transparent)",
          animation: "scanline 8s linear infinite",
        }} />
      </div>

      <Nav onGetStarted={goLogin} onExplore={goFeatures} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20"
        style={{ zIndex: 10 }}>

        <SectionTag text="The Ethereal Pulse is Live" />

        <h1 className="hero-title font-black leading-tight mb-6"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(42px, 8vw, 96px)",
            lineHeight: 1.05,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(40px)",
            transition: "all 1s ease 0.1s",
          }}>
          The Future of<br />
          Connection is<br />
          <span className="shimmer">ChatVerse</span>
        </h1>

        <p className="max-w-lg mb-10 leading-relaxed"
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "clamp(12px, 1.5vw, 15px)",
            fontFamily: "'Space Mono', monospace",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 1s ease 0.35s",
          }}>
          Experience an immersive social dimension where AI-driven avatars
          and real-time pulse messaging redefine human digital interaction.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-20"
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 1s ease 0.55s",
          }}>
          <button className="cta-primary" onClick={goLogin}>Get Started</button>
          <button className="cta-secondary" onClick={goFeatures}>Explore Universe</button>
        </div>

        {/* Floating mock UIs */}
        <div className="relative w-full max-w-4xl mx-auto h-64 md:h-80"
          style={{ opacity: heroVisible ? 1 : 0, transition: "opacity 1.2s ease 0.8s" }}>
          {/* Left card */}
          <div className="mock-ui absolute left-0 top-4 w-44 md:w-56 p-4 hidden sm:block"
            style={{ animationDelay: "0s", boxShadow: "0 20px 60px rgba(108,92,231,0.25)" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg" style={{ background: "linear-gradient(135deg,#6C5CE7,#a29bfe)" }} />
              <div>
                <div className="h-2 w-20 rounded mb-1" style={{ background: "rgba(255,255,255,0.2)" }} />
                <div className="h-1.5 w-14 rounded" style={{ background: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            {[70, 50, 85].map((w, i) => (
              <div key={i} className="h-1.5 rounded mb-1.5" style={{ width: w + "%", background: "rgba(108,92,231,0.3)" }} />
            ))}
            <div className="h-6 rounded-lg mt-3" style={{ background: "linear-gradient(135deg,rgba(108,92,231,0.3),rgba(0,212,255,0.2))" }} />
          </div>

          {/* Right card — live activity */}
          <div className="mock-ui absolute right-0 top-0 w-44 md:w-52 p-4"
            style={{ animationDelay: "1.5s", boxShadow: "0 20px 60px rgba(0,212,255,0.2)" }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: 2, fontFamily: "'Space Mono'" }}>LIVE ACTIVITY</span>
              <div className="pulse-dot" />
            </div>
            <div className="flex items-end gap-1.5 h-14">
              {[40, 65, 50, 80, 55, 90, 70, 85].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all"
                  style={{
                    height: h + "%",
                    background: i >= 5 ? "linear-gradient(180deg,#00d4ff,#6C5CE7)" : "rgba(108,92,231,0.3)",
                    animation: `float ${2 + i * 0.3}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.2}s`,
                  }} />
              ))}
            </div>
          </div>

          {/* Center glow ring */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(108,92,231,0.2) 0%, transparent 70%)", filter: "blur(20px)" }} />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <div style={{ fontFamily: "'Space Mono'", fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.5)" }}>SCROLL</div>
          <div className="w-px h-8" style={{ background: "linear-gradient(transparent, rgba(0,212,255,0.7))" }} />
        </div>
      </section>

      {/* ── NEXT-GEN INTERFACE SECTION ──────────────────────────────────── */}
      <RevealSection>
        <section className="relative px-6 py-24 max-w-6xl mx-auto" style={{ zIndex: 10 }}>
          <div className="mb-3">
            <div className="w-10 h-1 rounded-full mb-4" style={{ background: "linear-gradient(90deg,#6C5CE7,#00d4ff)" }} />
            <h2 className="font-black text-3xl md:text-4xl text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Next-Gen Interface
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
            {/* Large card with visual */}
            <FeatureCard
              icon="face_retouching_natural"
              title="AI Avatars"
              desc="Your digital twin, powered by neural networks. Adapts to your mood and speaks your style in every conversation."
              accent="#a29bfe"
              visual={
                <div className="relative h-36 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Abstract AI face */}
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping" style={{ animationDuration: "3s" }} />
                      <div className="absolute inset-2 rounded-full border border-purple-400/20 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
                      <div className="w-full h-full rounded-full flex items-center justify-center"
                        style={{ background: "radial-gradient(circle at 40% 40%, rgba(162,155,254,0.3), rgba(108,92,231,0.1))", border: "1px solid rgba(162,155,254,0.3)" }}>
                        <span className="material-symbols-outlined text-4xl" style={{ color: "rgba(162,155,254,0.7)" }}>person</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-4 flex gap-1">
                    {[1,2,3].map(i=>(
                      <div key={i} className="w-5 h-5 rounded-full" style={{ background: "rgba(162,155,254,0.2)", border: "1px solid rgba(162,155,254,0.3)" }} />
                    ))}
                    <div className="text-xs ml-1" style={{ color: "rgba(162,155,254,0.5)", fontFamily: "'Space Mono'", fontSize: 9 }}>+2.4k</div>
                  </div>
                </div>
              }
            />

            <FeatureCard
              icon="bolt"
              title="Real-time Messaging"
              desc="Zero-latency communication with built-in instant translation for global reach."
              accent="#00d4ff"
              visual={
                <div className="p-3 space-y-2">
                  {[
                    { w: "65%", align: "left",  color: "rgba(0,212,255,0.15)",  border: "rgba(0,212,255,0.2)" },
                    { w: "50%", align: "right", color: "rgba(108,92,231,0.25)", border: "rgba(108,92,231,0.3)" },
                    { w: "70%", align: "left",  color: "rgba(0,212,255,0.1)",   border: "rgba(0,212,255,0.15)" },
                  ].map((b, i) => (
                    <div key={i} className={`flex ${b.align === "right" ? "justify-end" : "justify-start"}`}>
                      <div className="h-3 rounded-full" style={{ width: b.w, background: b.color, border: `1px solid ${b.border}` }} />
                    </div>
                  ))}
                </div>
              }
            />

            <FeatureCard
              icon="diversity_3"
              title="Community Spaces"
              desc="Create ephemeral or permanent hubs. No hierarchies, just pure connection."
              accent="#55efc4"
            />

            <FeatureCard
              icon="lock"
              title="Encrypted Pulse"
              desc="Every word you speak is wrapped in quantum-resistant encryption layers. Privacy isn't a feature; it's the core."
              accent="#fd79a8"
              visual={
                <div className="flex items-center justify-center py-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(253,121,168,0.1)", border: "1px solid rgba(253,121,168,0.3)" }}>
                      <span className="material-symbols-outlined text-2xl" style={{ color: "rgba(253,121,168,0.8)" }}>lock</span>
                    </div>
                    {[0,1,2,3,4,5].map(i=>(
                      <div key={i} className="absolute text-xs" style={{
                        fontFamily: "'Space Mono'",
                        color: "rgba(253,121,168,0.3)",
                        fontSize: 8,
                        top: `${20 + Math.sin(i)*30}%`,
                        left: `${100 + Math.cos(i*1.1)*60}%`,
                        animation: `float ${2+i*0.5}s ease-in-out infinite alternate`,
                      }}>
                        {["AES","RSA","E2E","256","PGP","SSH"][i]}
                      </div>
                    ))}
                  </div>
                </div>
              }
            />
          </div>
        </section>
      </RevealSection>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <RevealSection>
        <section className="relative px-6 py-16" style={{ zIndex: 10 }}>
          <div className="max-w-4xl mx-auto rounded-3xl p-10"
            style={{ background: "rgba(108,92,231,0.06)", border: "1px solid rgba(108,92,231,0.15)", backdropFilter: "blur(20px)" }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <Stat value="2M+" label="Active Users" />
              <Stat value="99.9%" label="Uptime" />
              <Stat value="0ms" label="Avg Latency" />
              <Stat value="256-bit" label="Encryption" />
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── AVANT-GARDE SECTION ───────────────────────────────────────────── */}
      <RevealSection>
        <section className="relative px-6 py-24 max-w-6xl mx-auto" style={{ zIndex: 10 }}>
          <SectionTag text="Why Choose Us" />
          <h2 className="text-3xl md:text-4xl font-black text-center mb-16 text-white"
            style={{ fontFamily: "'Orbitron', sans-serif" }}>
            The Choice of the Avant-Garde
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "rocket_launch", title: "Hyper-Speed",   desc: "Optimized for 5G+ speeds. No spinners, no delays, just instant presence.",               accent: "#6C5CE7" },
              { icon: "hub",          title: "Infinite Flow",  desc: "Seamlessly move from voice to text to VR in a single, unified stream.",                  accent: "#00d4ff" },
              { icon: "language",     title: "Universal UI",   desc: "Adapts to any screen, holographic projection, or mobile device with grace.",              accent: "#a29bfe" },
              { icon: "smart_toy",    title: "AI-Powered",     desc: "Built-in Claude AI assistant for drafting, translation, and intelligent responses.",      accent: "#fd79a8" },
              { icon: "groups",       title: "Group Worlds",   desc: "Ephemeral spaces or permanent communities — you decide how your network breathes.",       accent: "#55efc4" },
              { icon: "videocam",     title: "Holographic Calls", desc: "WebRTC video and voice calls with screen sharing, virtual backgrounds, and recording.", accent: "#fdcb6e" },
            ].map((f, i) => (
              <div key={i} className="text-center p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-12 h-12 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{ background: `${f.accent}15`, border: `1px solid ${f.accent}30` }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: f.accent }}>{f.icon}</span>
                </div>
                <h3 className="font-bold text-white mb-3" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, letterSpacing: 1 }}>{f.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* ── CTA BOTTOM ───────────────────────────────────────────────────── */}
      <RevealSection>
        <section className="relative px-6 py-24" style={{ zIndex: 10 }}>
          <div className="max-w-2xl mx-auto text-center rounded-3xl p-14 relative overflow-hidden"
            style={{ background: "rgba(108,92,231,0.08)", border: "1px solid rgba(108,92,231,0.2)", backdropFilter: "blur(30px)" }}>
            {/* BG glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(108,92,231,0.15) 0%, transparent 70%)" }} />

            <h2 className="text-3xl md:text-4xl font-black mb-4 text-white" style={{ fontFamily: "'Orbitron', sans-serif", lineHeight: 1.2 }}>
              Ready to sync with<br />the future?
            </h2>
            <p className="mb-8" style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.7 }}>
              Join 2M+ users who are already pulsing. Claim your unique digital handle before it's gone.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <input
                placeholder="Enter your email"
                className="rounded-full px-5 py-3 text-sm w-full sm:w-64 outline-none border"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 12,
                }}
              />
              <button className="cta-primary whitespace-nowrap" onClick={goLogin}>Join Pulse</button>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="relative px-8 py-10 border-t" style={{ zIndex: 10, borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontFamily: "'Orbitron', sans-serif", color: "#00d4ff", fontWeight: 700, letterSpacing: 3, fontSize: 14 }}>CHATVERSE</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "'Space Mono'" }}>
              © 2024 ChatVerse. The Ethereal Pulse of Connection.
            </p>
          </div>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Safety", "Developers"].map(l => (
              <button key={l} style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'Space Mono'" }}
                className="hover:text-white transition-colors">{l}</button>
            ))}
          </div>
          <div className="flex gap-3">
            {["share", "open_in_new"].map(icon => (
              <div key={icon} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="material-symbols-outlined text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{icon}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Scroll reveal wrapper ─────────────────────────────────────────────────────
function RevealSection({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`section-reveal ${visible ? "visible" : ""}`}>
      {children}
    </div>
  );
}