import React, { createContext, useContext, useState, useEffect } from "react";

const AppSettingsContext = createContext();

const DEFAULT_SETTINGS = {
  // Appearance
  theme: "light",          // "light" | "dark" | "system"
  fontSize: "medium",      // "small" | "medium" | "large"
  accentColor: "#6C5CE7",  // hex color
  bubbleStyle: "rounded",  // "rounded" | "sharp" | "bubble"
  compactMode: false,

  // Notifications
  notifMessages: true,
  notifCalls: true,
  notifStories: false,
  notifSounds: true,
  notifVibrate: true,
  notifPreview: true,      // show message preview in notification

  // Privacy
  showLastSeen: true,
  showReadReceipts: true,
  showOnlineStatus: true,
  showTypingIndicator: true,

  // Profile (display only — real save goes to backend)
  displayName: "",
  bio: "Hey, I'm using ChatVerse!",
  avatarUrl: "",
};

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("cv_settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem("cv_settings", JSON.stringify(settings));
  }, [settings]);

  // Apply theme to <html> element
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark =
      settings.theme === "dark" ||
      (settings.theme === "system" && prefersDark);

    if (isDark) {
      root.classList.add("dark");
      document.body.style.background = "#0f0f13";
    } else {
      root.classList.remove("dark");
      document.body.style.background = "";
    }
  }, [settings.theme]);

  // Apply font size to root
  useEffect(() => {
    const sizeMap = { small: "13px", medium: "15px", large: "17px" };
    document.documentElement.style.fontSize = sizeMap[settings.fontSize] || "15px";
  }, [settings.fontSize]);

  // Apply accent color CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", settings.accentColor);
  }, [settings.accentColor]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateMany = (patch) => {
    setSettings(prev => ({ ...prev, ...patch }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("cv_settings");
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSetting, updateMany, resetSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppSettingsContext);