import React, { useState, useRef } from "react";
import axios from "axios";
import { useAppSettings } from "../context/AppSettingsContext";
import { useAuth } from "../context/AuthContext";

const API = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

// ── Reusable Toggle ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none
        ${checked ? "bg-[#6C5CE7] shadow-[0_0_8px_rgba(108,92,231,0.5)]" : "bg-outline-variant"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300
        ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

// ── Section Row ───────────────────────────────────────────────────────────────
function SectionRow({ icon, label, desc, children, danger = false }) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex-1 min-w-0 pr-4">
        <p className={`text-sm font-medium ${danger ? "text-red-500" : "text-on-surface"}`}>{label}</p>
        {desc && <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="h-px bg-outline-variant/40 my-1" />;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS PANEL
// ════════════════════════════════════════════════════════════════════════════
export default function SettingsPanel({ user, logout }) {
  const { settings, updateSetting, updateMany, resetSettings } = useAppSettings();
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [profileForm, setProfileForm] = useState({ displayName: settings.displayName || user?.username || "", bio: settings.bio });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? `${API}${user.avatar}` : null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [storageCleared, setStorageCleared] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const avatarInputRef = useRef(null);

  const sections = [
    { key: "profile",       icon: "person",        label: "Profile" },
    { key: "notifications", icon: "notifications",  label: "Notifications" },
    { key: "privacy",       icon: "lock",           label: "Privacy" },
    { key: "appearance",    icon: "palette",        label: "Appearance" },
    { key: "storage",       icon: "storage",        label: "Storage" },
    { key: "about",         icon: "info",           label: "About" },
  ];

  // ── Profile save ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError("");
    try {
      updateMany({ displayName: profileForm.displayName, bio: profileForm.bio });
      // Optionally sync display name to backend (if endpoint exists)
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError("Failed to save. Try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await axios.put(`${API}/api/users/avatar`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      // Persist the server URL into settings so the sidebar profile button reflects it immediately
      const serverPath = res.data?.avatar || res.data?.user?.avatar;
      if (serverPath) {
        updateSetting("avatarUrl", `${API}${serverPath}`);
      } else {
        // Fallback: store the local blob preview so sidebar updates even if server path isn't returned
        updateSetting("avatarUrl", preview);
      }
    } catch {
      // Preview still shows locally even if upload fails
      updateSetting("avatarUrl", preview);
    } finally {
      setAvatarUploading(false);
    }
    e.target.value = "";
  };

  // ── Storage clear ─────────────────────────────────────────────────────────
  const clearCache = () => {
    localStorage.removeItem("cv_msgCache");
    setStorageCleared(true);
    setTimeout(() => setStorageCleared(false), 2000);
  };

  // ── Accent colors ─────────────────────────────────────────────────────────
  const accentColors = [
    { name: "Violet",  hex: "#6C5CE7" },
    { name: "Blue",    hex: "#0984e3" },
    { name: "Teal",    hex: "#00b894" },
    { name: "Pink",    hex: "#e84393" },
    { name: "Orange",  hex: "#e17055" },
    { name: "Gold",    hex: "#f9a825" },
  ];

  // ── Font sizes ────────────────────────────────────────────────────────────
  const fontSizes = [
    { key: "small",  label: "A",  size: "text-xs" },
    { key: "medium", label: "A",  size: "text-sm" },
    { key: "large",  label: "A",  size: "text-base" },
  ];

  return (
    <section
      className={`w-80 h-full flex flex-col transition-colors duration-300
        ${settings.theme === "dark" ? "bg-[#1a1b23] border-r border-white/5" : "bg-surface-container-lowest"}`}
      style={{ animation: "slideIn 0.3s ease-out" }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className={`text-lg font-bold ${settings.theme === "dark" ? "text-white" : "text-on-surface"}`}
          style={{ animation: "slideIn 0.3s ease-out" }}>
          Settings
        </h1>
      </div>

      {/* User Card */}
      <div className={`mx-4 mb-4 p-4 rounded-2xl border flex items-center gap-3 transition-colors
        ${settings.theme === "dark"
          ? "bg-white/5 border-white/10"
          : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/15"}`}>
        <div className="relative">
          {avatarPreview
            ? <img src={avatarPreview} alt="avatar" className="w-12 h-12 rounded-2xl object-cover" />
            : <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center font-bold text-white text-lg">
                {(settings.displayName || user?.username || "?")[0].toUpperCase()}
              </div>}
          {avatarUploading && (
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${settings.theme === "dark" ? "text-white" : "text-on-surface"}`}>
            {settings.displayName || user?.username}
          </p>
          <p className={`text-xs truncate ${settings.theme === "dark" ? "text-white/50" : "text-on-surface-variant"}`}>
            {user?.email}
          </p>
        </div>
        <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
        {sections.map((s) => (
          <div key={s.key}>
            {/* Section Button */}
            <button
              onClick={() => setActiveSection(activeSection === s.key ? null : s.key)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 mb-1 text-left
                ${activeSection === s.key
                  ? settings.theme === "dark" ? "bg-white/10" : "bg-primary/8"
                  : settings.theme === "dark" ? "hover:bg-white/5" : "hover:bg-surface-container-low/60"}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
                ${activeSection === s.key
                  ? "bg-[#6C5CE7] shadow-[0_0_10px_rgba(108,92,231,0.4)]"
                  : settings.theme === "dark" ? "bg-white/10" : "bg-surface-container-low"}`}>
                <span className={`material-symbols-outlined text-[18px]
                  ${activeSection === s.key ? "text-white" : settings.theme === "dark" ? "text-white/60" : "text-on-surface-variant"}`}>
                  {s.icon}
                </span>
              </div>
              <span className={`text-sm font-medium flex-1
                ${activeSection === s.key
                  ? "text-[#6C5CE7]"
                  : settings.theme === "dark" ? "text-white/80" : "text-on-surface"}`}>
                {s.label}
              </span>
              <span className={`material-symbols-outlined text-sm transition-transform duration-200
                ${settings.theme === "dark" ? "text-white/30" : "text-on-surface-variant"}
                ${activeSection === s.key ? "rotate-90" : ""}`}>
                chevron_right
              </span>
            </button>

            {/* ── PROFILE ──────────────────────────────────────────────── */}
            {activeSection === "profile" && s.key === "profile" && (
              <div className={`mx-1 mb-3 p-4 rounded-2xl border flex flex-col gap-4
                ${settings.theme === "dark" ? "bg-white/5 border-white/10" : "bg-surface-container-low border-outline-variant/30"}`}
                style={{ animation: "fadeUp 0.2s ease-out" }}>

                <p className={`text-xs ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>
                  Edit your profile photo, name and bio on the right panel →
                </p>

                {profileError && <p className="text-xs text-red-500">{profileError}</p>}
              </div>
            )}

            {/* ── NOTIFICATIONS ────────────────────────────────────────── */}
            {activeSection === "notifications" && s.key === "notifications" && (
              <div className={`mx-1 mb-3 p-4 rounded-2xl border flex flex-col gap-1
                ${settings.theme === "dark" ? "bg-white/5 border-white/10" : "bg-surface-container-low border-outline-variant/30"}`}
                style={{ animation: "fadeUp 0.2s ease-out" }}>

                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>
                  Push Notifications
                </p>
                <SectionRow label="Messages" desc="Get notified for new messages">
                  <Toggle checked={settings.notifMessages} onChange={v => updateSetting("notifMessages", v)} />
                </SectionRow>
                <Divider />
                <SectionRow label="Calls" desc="Incoming call ringtone & alert">
                  <Toggle checked={settings.notifCalls} onChange={v => updateSetting("notifCalls", v)} />
                </SectionRow>
                <Divider />
                <SectionRow label="Stories" desc="When contacts post new stories">
                  <Toggle checked={settings.notifStories} onChange={v => updateSetting("notifStories", v)} />
                </SectionRow>

                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 mt-3 ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>
                  Sound & Vibration
                </p>
                <SectionRow label="Notification Sounds" desc="Play sound for new notifications">
                  <Toggle checked={settings.notifSounds} onChange={v => updateSetting("notifSounds", v)} />
                </SectionRow>
                <Divider />
                <SectionRow label="Vibration" desc="Vibrate on incoming notifications">
                  <Toggle checked={settings.notifVibrate} onChange={v => updateSetting("notifVibrate", v)} />
                </SectionRow>

                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 mt-3 ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>
                  Content
                </p>
                <SectionRow label="Message Preview" desc="Show content in notifications">
                  <Toggle checked={settings.notifPreview} onChange={v => updateSetting("notifPreview", v)} />
                </SectionRow>

                {/* Request permission */}
                <button
                  onClick={() => Notification.requestPermission()}
                  className="mt-3 w-full py-2 rounded-xl text-xs font-semibold bg-[#6C5CE7]/10 text-[#6C5CE7] hover:bg-[#6C5CE7]/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm align-middle mr-1">notifications_active</span>
                  Enable Browser Notifications
                </button>
              </div>
            )}

            {/* ── PRIVACY ──────────────────────────────────────────────── */}
            {activeSection === "privacy" && s.key === "privacy" && (
              <div className={`mx-1 mb-3 p-4 rounded-2xl border flex flex-col gap-1
                ${settings.theme === "dark" ? "bg-white/5 border-white/10" : "bg-surface-container-low border-outline-variant/30"}`}
                style={{ animation: "fadeUp 0.2s ease-out" }}>

                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>
                  Visibility
                </p>
                <SectionRow label="Last Seen" desc="Show when you were last active">
                  <Toggle checked={settings.showLastSeen} onChange={v => updateSetting("showLastSeen", v)} />
                </SectionRow>
                <Divider />
                <SectionRow label="Online Status" desc="Show the green dot when active">
                  <Toggle checked={settings.showOnlineStatus} onChange={v => updateSetting("showOnlineStatus", v)} />
                </SectionRow>

                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 mt-3 ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>
                  Messaging
                </p>
                <SectionRow label="Read Receipts" desc="Show ✓✓ when messages are read">
                  <Toggle checked={settings.showReadReceipts} onChange={v => updateSetting("showReadReceipts", v)} />
                </SectionRow>
                <Divider />
                <SectionRow label="Typing Indicator" desc='Show "typing..." to contacts'>
                  <Toggle checked={settings.showTypingIndicator} onChange={v => updateSetting("showTypingIndicator", v)} />
                </SectionRow>

                {/* Privacy note */}
                <div className={`mt-3 p-3 rounded-xl flex items-start gap-2
                  ${settings.theme === "dark" ? "bg-white/5" : "bg-primary/5"}`}>
                  <span className="material-symbols-outlined text-[#6C5CE7] text-sm mt-0.5">info</span>
                  <p className={`text-[11px] leading-relaxed ${settings.theme === "dark" ? "text-white/50" : "text-on-surface-variant"}`}>
                    Privacy changes take effect immediately for new interactions.
                  </p>
                </div>
              </div>
            )}

            {/* ── APPEARANCE ───────────────────────────────────────────── */}
            {activeSection === "appearance" && s.key === "appearance" && (
              <div className={`mx-1 mb-3 p-4 rounded-2xl border flex flex-col gap-4
                ${settings.theme === "dark" ? "bg-white/5 border-white/10" : "bg-surface-container-low border-outline-variant/30"}`}
                style={{ animation: "fadeUp 0.2s ease-out" }}>

                {/* Theme */}
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>
                    Theme
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "light",  icon: "light_mode",  label: "Light" },
                      { key: "dark",   icon: "dark_mode",   label: "Dark" },
                      { key: "system", icon: "devices",     label: "System" },
                    ].map(t => (
                      <button key={t.key} onClick={() => updateSetting("theme", t.key)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                          ${settings.theme === t.key
                            ? "border-[#6C5CE7] bg-[#6C5CE7]/10 shadow-[0_0_8px_rgba(108,92,231,0.2)]"
                            : settings.theme === "dark"
                            ? "border-white/10 hover:border-white/20"
                            : "border-outline-variant hover:border-primary/40"}`}>
                        <span className={`material-symbols-outlined text-xl ${settings.theme === t.key ? "text-[#6C5CE7]" : settings.theme === "dark" ? "text-white/50" : "text-on-surface-variant"}`}>
                          {t.icon}
                        </span>
                        <span className={`text-[10px] font-semibold ${settings.theme === t.key ? "text-[#6C5CE7]" : settings.theme === "dark" ? "text-white/50" : "text-on-surface-variant"}`}>
                          {t.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <Divider />

                {/* Accent Color */}
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>
                    Accent Color
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {accentColors.map(c => (
                      <button key={c.hex} onClick={() => updateSetting("accentColor", c.hex)} title={c.name}
                        className={`w-8 h-8 rounded-full transition-all hover:scale-110
                          ${settings.accentColor === c.hex ? "ring-2 ring-offset-2 scale-110 ring-[#6C5CE7]" : ""}`}
                        style={{ background: c.hex }} />
                    ))}
                  </div>
                  <p className={`text-[10px] mt-1.5 ${settings.theme === "dark" ? "text-white/30" : "text-on-surface-variant"}`}>
                    Accent color updates on next page load
                  </p>
                </div>

                <Divider />

                {/* Font Size */}
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>
                    Text Size
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>A</span>
                    <div className="flex-1 flex gap-1">
                      {fontSizes.map(f => (
                        <button key={f.key} onClick={() => updateSetting("fontSize", f.key)}
                          className={`flex-1 py-2 rounded-xl border-2 font-bold transition-all ${f.size}
                            ${settings.fontSize === f.key
                              ? "border-[#6C5CE7] bg-[#6C5CE7]/10 text-[#6C5CE7]"
                              : settings.theme === "dark"
                              ? "border-white/10 text-white/50 hover:border-white/20"
                              : "border-outline-variant text-on-surface-variant hover:border-primary/40"}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <span className={`text-base font-bold ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>A</span>
                  </div>
                </div>

                <Divider />

                {/* Compact Mode */}
                <SectionRow label="Compact Mode" desc="Denser message layout, smaller spacing">
                  <Toggle checked={settings.compactMode} onChange={v => updateSetting("compactMode", v)} />
                </SectionRow>

                {/* Preview */}
                <div className={`p-3 rounded-xl border ${settings.theme === "dark" ? "bg-[#0f0f13] border-white/10" : "bg-white border-outline-variant/30"}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${settings.theme === "dark" ? "text-white/30" : "text-on-surface-variant"}`}>Preview</p>
                  <div className="flex flex-col gap-1.5">
                    <div className="self-start">
                      <div className={`px-3 py-2 rounded-2xl text-xs ${settings.theme === "dark" ? "bg-white/10 text-white" : "bg-surface-container text-on-surface"}`}>
                        Hey! How's it going? 👋
                      </div>
                    </div>
                    <div className="self-end">
                      <div className="px-3 py-2 rounded-2xl text-xs text-white" style={{ background: settings.accentColor }}>
                        All good, thanks! 😊
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STORAGE ──────────────────────────────────────────────── */}
            {activeSection === "storage" && s.key === "storage" && (
              <div className={`mx-1 mb-3 p-4 rounded-2xl border flex flex-col gap-4
                ${settings.theme === "dark" ? "bg-white/5 border-white/10" : "bg-surface-container-low border-outline-variant/30"}`}
                style={{ animation: "fadeUp 0.2s ease-out" }}>

                {/* Total */}
                <div className={`p-3 rounded-xl flex items-center gap-3 ${settings.theme === "dark" ? "bg-white/5" : "bg-white"}`}>
                  <div className="w-10 h-10 rounded-xl bg-[#6C5CE7] flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-sm">database</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${settings.theme === "dark" ? "text-white" : "text-on-surface"}`}>Total Used</p>
                    <p className={`text-[10px] ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>298 MB of 5 GB</p>
                    <div className="w-full h-1.5 bg-outline-variant rounded-full mt-1.5">
                      <div className="h-full bg-[#6C5CE7] rounded-full" style={{ width: "6%" }} />
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold ${settings.theme === "dark" ? "text-white/60" : "text-on-surface-variant"}`}>6%</span>
                </div>

                {/* Breakdown */}
                <p className={`text-[10px] font-bold uppercase tracking-wider ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>
                  Breakdown
                </p>
                {[
                  { label: "Photos & Videos", size: "248 MB", icon: "image",       color: "#0984e3", pct: 83 },
                  { label: "Audio Messages",  size: "32 MB",  icon: "mic",         color: "#6C5CE7", pct: 11 },
                  { label: "Documents",       size: "12 MB",  icon: "description", color: "#e17055", pct: 4  },
                  { label: "App Cache",       size: "6 MB",   icon: "cached",      color: "#00b894", pct: 2  },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color + "20" }}>
                      <span className="material-symbols-outlined text-sm" style={{ color: item.color }}>{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className={`text-xs font-medium truncate ${settings.theme === "dark" ? "text-white/80" : "text-on-surface"}`}>{item.label}</p>
                        <span className={`text-[10px] font-mono ml-2 shrink-0 ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>{item.size}</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full ${settings.theme === "dark" ? "bg-white/10" : "bg-outline-variant"}`}>
                        <div className="h-full rounded-full transition-all" style={{ width: item.pct + "%", background: item.color }} />
                      </div>
                    </div>
                  </div>
                ))}

                <Divider />

                {/* Auto-download */}
                <p className={`text-[10px] font-bold uppercase tracking-wider ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>
                  Auto-Download
                </p>
                {[
                  { label: "Images", key: "autoImages" },
                  { label: "Videos", key: "autoVideos" },
                  { label: "Documents", key: "autoDocs" },
                ].map(item => (
                  <SectionRow key={item.key} label={item.label} desc="Auto-download on Wi-Fi">
                    <Toggle checked={true} onChange={() => {}} />
                  </SectionRow>
                ))}

                <Divider />

                {/* Clear actions */}
                <button
                  onClick={clearCache}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
                    ${storageCleared
                      ? "bg-green-500 text-white"
                      : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`}
                >
                  <span className="material-symbols-outlined text-sm">{storageCleared ? "check" : "cached"}</span>
                  {storageCleared ? "Cache Cleared!" : "Clear App Cache"}
                </button>

                {/* Danger: clear all */}
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                    Clear All Local Data
                  </button>
                ) : (
                  <div className={`p-3 rounded-xl border border-red-200 ${settings.theme === "dark" ? "bg-red-500/10" : "bg-red-50"}`}>
                    <p className="text-xs text-red-600 font-medium mb-2">This will clear all cached data. Are you sure?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-1.5 rounded-lg text-xs text-on-surface-variant bg-white border border-outline-variant hover:bg-surface-container">Cancel</button>
                      <button onClick={() => { localStorage.clear(); setShowResetConfirm(false); }} className="flex-1 py-1.5 rounded-lg text-xs text-white bg-red-500 hover:bg-red-600">Confirm</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ABOUT ────────────────────────────────────────────────── */}
            {activeSection === "about" && s.key === "about" && (
              <div className={`mx-1 mb-3 p-4 rounded-2xl border flex flex-col gap-4
                ${settings.theme === "dark" ? "bg-white/5 border-white/10" : "bg-surface-container-low border-outline-variant/30"}`}
                style={{ animation: "fadeUp 0.2s ease-out" }}>

                {/* App identity */}
                <div className="flex flex-col items-center py-2 gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#a19afd] flex items-center justify-center shadow-xl shadow-[#6C5CE7]/30">
                    <span className="text-white font-extrabold text-2xl">M</span>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-extrabold" style={{
                      background: "linear-gradient(135deg,#6C5CE7,#a19afd)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
                    }}>ChatVerse</p>
                    <p className={`text-xs ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>Version 1.0.0 (Build 100)</p>
                  </div>
                </div>

                <Divider />

                {/* Info rows */}
                {[
                  { label: "Developer",   value: "ChatVerse Team" },
                  { label: "Platform",    value: "React + Node.js" },
                  { label: "Protocol",    value: "WebSocket / WebRTC" },
                  { label: "Database",    value: "MongoDB" },
                  { label: "License",     value: "MIT" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-0.5">
                    <span className={`text-xs ${settings.theme === "dark" ? "text-white/40" : "text-on-surface-variant"}`}>{row.label}</span>
                    <span className={`text-xs font-medium ${settings.theme === "dark" ? "text-white/80" : "text-on-surface"}`}>{row.value}</span>
                  </div>
                ))}

                <Divider />

                {/* Tech badges */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {[
                    { label: "WebRTC",     color: "#0984e3" },
                    { label: "Socket.io",  color: "#00b894" },
                    { label: "MongoDB",    color: "#e17055" },
                    { label: "JWT Auth",   color: "#6C5CE7" },
                    { label: "Tailwind",   color: "#38bdf8" },
                    { label: "Multer",     color: "#f9a825" },
                  ].map(b => (
                    <span key={b.label} className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: b.color + "cc" }}>
                      {b.label}
                    </span>
                  ))}
                </div>

                <Divider />

                {/* Reset settings */}
                <button
                  onClick={() => { resetSettings(); }}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors
                    ${settings.theme === "dark" ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
                >
                  Reset All Settings to Default
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Sign Out */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all mt-1 mb-2 group
            ${settings.theme === "dark" ? "hover:bg-red-500/10" : "hover:bg-red-50"}`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors
            ${settings.theme === "dark" ? "bg-red-500/10 group-hover:bg-red-500/20" : "bg-red-50 group-hover:bg-red-100"}`}>
            <span className="material-symbols-outlined text-red-500 text-[18px]">logout</span>
          </div>
          <span className="text-sm font-semibold text-red-500">Sign out</span>
        </button>
      </div>
    </section>
  );
}