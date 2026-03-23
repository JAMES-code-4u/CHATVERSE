import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ── Exact same StarField as HomePage ─────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    let W, H;

    const STAR_COUNT = 320;
    const stars = [];
    const shootingStars = [];
    let nebulaTime = 0;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 1200,
        z: Math.random() * 1500 + 1,
        size: Math.random() * 1.8 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + Math.random() * 0.025,
        color: Math.random() > 0.85
          ? `hsl(${200 + Math.random() * 60},80%,85%)`
          : Math.random() > 0.7
            ? `hsl(${260 + Math.random() * 30},60%,90%)`
            : "#ffffff",
      });
    }

    const spawnShootingStar = () => {
      if (shootingStars.length < 3 && Math.random() < 0.008) {
        shootingStars.push({
          x: Math.random() * W, y: Math.random() * H * 0.5,
          vx: 6 + Math.random() * 8, vy: 2 + Math.random() * 4,
          len: 80 + Math.random() * 120, life: 1,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0,   "#00000f");
      bg.addColorStop(0.3, "#050012");
      bg.addColorStop(0.7, "#030018");
      bg.addColorStop(1,   "#000008");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      nebulaTime += 0.003;

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
        grad.addColorStop(1,   "transparent");
        ctx.save();
        ctx.scale(n.rx / Math.max(n.rx, n.ry), n.ry / Math.max(n.rx, n.ry));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(
          n.cx / (n.rx / Math.max(n.rx, n.ry)),
          n.cy / (n.ry / Math.max(n.rx, n.ry)),
          Math.max(n.rx, n.ry) * pulse, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      });

      stars.forEach(s => {
        s.twinkle += s.twinkleSpeed;
        const alpha   = 0.45 + Math.sin(s.twinkle) * 0.55;
        const screenX = (s.x / s.z) * W + W / 2;
        const screenY = (s.y / s.z) * H + H / 2;
        if (screenX < -10 || screenX > W + 10 || screenY < -10 || screenY > H + 10) return;
        if (s.size > 1.3) {
          const glow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, s.size * 4);
          glow.addColorStop(0, `rgba(180,180,255,${alpha * 0.4})`);
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

      spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx; ss.y += ss.vy; ss.life -= 0.018;
        if (ss.life <= 0) { shootingStars.splice(i, 1); continue; }
        const grad = ctx.createLinearGradient(
          ss.x - ss.vx * (ss.len / 10), ss.y - ss.vy * (ss.len / 10), ss.x, ss.y
        );
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, `rgba(180,220,255,${ss.life * 0.9})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.5 * ss.life;
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

  return (
    <canvas ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }} />
  );
}

// ── Main LoginPage ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm]     = useState({ username: "", email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");

  useEffect(() => {
    // Fonts — same as HomePage
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.username, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: "videocam",      label: "HD Video & Voice Calls",  accent: "#6C5CE7" },
    { icon: "mic",           label: "AI Voice Messaging",       accent: "#00d4ff" },
    { icon: "screen_share",  label: "Screen Sharing",           accent: "#a29bfe" },
    { icon: "attach_file",   label: "Rich Media Sharing",       accent: "#55efc4" },
    { icon: "smart_toy",     label: "AI Assistant Built-in",    accent: "#fd79a8" },
    { icon: "lock",          label: "End-to-End Encrypted",     accent: "#fdcb6e" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex",
      background: "#00000f", overflow: "hidden",
      fontFamily: "'Space Mono', monospace",
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:wght@400;700&display=swap');

        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 20px rgba(108,92,231,0.5), 0 0 60px rgba(108,92,231,0.15); }
          50%      { box-shadow: 0 0 40px rgba(108,92,231,0.8), 0 0 100px rgba(108,92,231,0.3); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes gridPulse {
          0%,100% { opacity: 0.03; }
          50%      { opacity: 0.07; }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(8px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFloat {
          0%   { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-30px) scale(1.06); }
        }
        @keyframes borderGlow {
          0%,100% { border-color: rgba(108,92,231,0.3); box-shadow: 0 0 0 transparent; }
          50%      { border-color: rgba(0,212,255,0.5);  box-shadow: 0 0 12px rgba(0,212,255,0.15); }
        }

        .login-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 13px 18px;
          color: #fff;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        }
        .login-input::placeholder { color: rgba(255,255,255,0.25); }
        .login-input:focus {
          background: rgba(108,92,231,0.08);
          border-color: rgba(108,92,231,0.6);
          box-shadow: 0 0 0 3px rgba(108,92,231,0.12), 0 0 20px rgba(108,92,231,0.08);
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #6C5CE7, #00d4ff);
          color: #fff;
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: pulseGlow 3s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.01);
          filter: brightness(1.1);
        }
        .login-btn:disabled { opacity: 0.55; cursor: not-allowed; animation: none; }
        .login-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .login-btn:hover:not(:disabled)::before { transform: translateX(100%); }

        .grid-overlay {
          background-image:
            linear-gradient(rgba(108,92,231,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108,92,231,0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridPulse 4s ease-in-out infinite;
        }

        .feature-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.25s ease;
        }
        .feature-row:hover {
          background: rgba(108,92,231,0.08);
          border-color: rgba(108,92,231,0.25);
          transform: translateX(4px);
        }

        .label-text {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          display: block;
          margin-bottom: 7px;
        }
      `}</style>

      {/* ── Starfield background ─────────────────────────────────────── */}
      <StarField />

      {/* ── Grid overlay ─────────────────────────────────────────────── */}
      <div className="grid-overlay" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }} />

      {/* ── Scanline ─────────────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: "2px",
          background: "linear-gradient(transparent, rgba(108,92,231,0.12), transparent)",
          animation: "scanline 8s linear infinite",
        }} />
      </div>

      {/* ── Floating orbs ────────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
        {[
          { w: 350, h: 350, top: "5%",  left: "2%",  color: "rgba(108,92,231,0.07)", dur: "18s" },
          { w: 250, h: 250, top: "55%", left: "70%", color: "rgba(0,212,255,0.06)",  dur: "22s" },
          { w: 180, h: 180, top: "25%", left: "55%", color: "rgba(160,100,255,0.07)",dur: "15s" },
        ].map((o, i) => (
          <div key={i} style={{
            position: "absolute",
            width: o.w, height: o.h, top: o.top, left: o.left,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            animation: `orbFloat ${o.dur} ease-in-out infinite alternate`,
            animationDelay: `${i * 2.5}s`,
          }} />
        ))}
      </div>

      {/* ── Left panel ───────────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "48%", display: "none", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 40px",
        overflowY: "hidden",
        borderRight: "1px solid rgba(108,92,231,0.12)",
      }} className="login-left-panel">

        <style>{`
          @media (min-width: 1024px) {
            .login-left-panel { display: flex !important; }
          }
          /* Hide all scrollbars globally on login page */
          * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
          *::-webkit-scrollbar { display: none !important; }
        `}</style>

        {/* Logo */}
        <div style={{ textAlign: "center", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "linear-gradient(135deg,#6C5CE7,#00d4ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "pulseGlow 3s ease-in-out infinite, float 6s ease-in-out infinite",
            }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 26, fontFamily: "'Orbitron', sans-serif" }}>M</span>
            </div>
          </div>

          {/* Brand name */}
          <div style={{ marginBottom: 6 }}>
            <span style={{
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(22px,2.5vw,34px)",
              background: "linear-gradient(90deg,#6C5CE7,#00d4ff,#a29bfe,#00d4ff,#6C5CE7)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 4s linear infinite",
            }}>CHATVERSE</span>
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }} />
            <span style={{ fontFamily: "'Space Mono'", fontSize: 9, letterSpacing: 3, color: "#00d4ff" }}>
              THE ETHEREAL PULSE IS LIVE
            </span>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }} />
          </div>

          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 1.7, maxWidth: 320, margin: "0 auto 20px" }}>
            Experience an immersive social dimension where AI-driven avatars and real-time pulse messaging redefine human digital interaction.
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7, textAlign: "left" }}>
            {features.map((f, i) => (
              <div key={f.label} className="feature-row" style={{ padding: "8px 12px" }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  background: `${f.accent}18`,
                  border: `1px solid ${f.accent}35`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span className="material-symbols-outlined" style={{ color: f.accent, fontSize: 14 }}>{f.icon}</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "'Space Mono'" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 10,
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 32px",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Mobile logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }} className="mobile-logo">
            <style>{`.mobile-logo { display: flex; } @media (min-width: 1024px) { .mobile-logo { display: none !important; } }`}</style>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "linear-gradient(135deg,#6C5CE7,#00d4ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "pulseGlow 3s ease-in-out infinite",
            }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 22, fontFamily: "'Orbitron', sans-serif" }}>M</span>
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(108,92,231,0.2)",
            borderRadius: 24,
            padding: "36px 36px",
            backdropFilter: "blur(24px)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            animation: "fadeIn 0.6s ease-out",
          }}>
            {/* Card top glow */}
            <div style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              width: "60%", height: 1,
              background: "linear-gradient(90deg, transparent, rgba(108,92,231,0.6), rgba(0,212,255,0.4), transparent)",
              borderRadius: 1,
            }} />

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 900,
                fontSize: 20,
                color: "#fff",
                marginBottom: 6,
                letterSpacing: 1,
              }}>
                {isRegister ? "Create Account" : "Welcome Back"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, fontFamily: "'Space Mono'" }}>
                {isRegister
                  ? "Join the pulse — it's free forever"
                  : "Sign in to continue your conversations"}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 18,
                padding: "12px 16px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 12,
                color: "#fca5a5",
                fontSize: 12,
                fontFamily: "'Space Mono'",
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {isRegister && (
                <div>
                  <label className="label-text">Username</label>
                  <input
                    className="login-input"
                    type="text"
                    placeholder="cooluser123"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    onFocus={() => setFocused("username")}
                    onBlur={() => setFocused("")}
                    required
                  />
                </div>
              )}

              <div>
                <label className="label-text">Email</label>
                <input
                  className="login-input"
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused("")}
                  required
                />
              </div>

              <div>
                <label className="label-text">Password</label>
                <input
                  className="login-input"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <svg style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
                      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {isRegister ? "CREATING ACCOUNT..." : "SIGNING IN..."}
                  </span>
                ) : isRegister ? "CREATE ACCOUNT" : "SIGN IN"}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "'Space Mono'" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Toggle */}
            <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'Space Mono'" }}>
              {isRegister ? "Already pulsing?" : "New to the universe?"}{" "}
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(""); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#00d4ff", fontFamily: "'Space Mono'", fontSize: 12,
                  fontWeight: 700, textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => e.target.style.color = "#a29bfe"}
                onMouseLeave={e => e.target.style.color = "#00d4ff"}
              >
                {isRegister ? "Sign in →" : "Create account →"}
              </button>
            </p>
          </div>

          {/* Back to home */}
          <p style={{ textAlign: "center", marginTop: 20 }}>
            <button
              onClick={() => navigate("/home")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.25)", fontFamily: "'Space Mono'",
                fontSize: 11, letterSpacing: 1, transition: "color 0.2s",
              }}
              onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.6)"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.25)"}
            >
              ← Back to ChatVerse
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}