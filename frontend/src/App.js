import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";
import FeaturesPage from "./pages/FeaturesPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: "#00000f" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
            style={{ background: "linear-gradient(135deg,#6C5CE7,#00d4ff)", boxShadow: "0 0 30px rgba(108,92,231,0.5)" }}>
            <span className="text-white font-extrabold text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>M</span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Space Mono', monospace" }}>
            Loading ChatVerse...
          </p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/home"     element={<HomePage />} />
      <Route path="/features" element={<FeaturesPage />} />

      {/* Auth — redirect to /app if already logged in */}
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <LoginPage />} />

      {/* Protected chat app */}
      <Route path="/app" element={
        <ProtectedRoute>
          <SocketProvider>
            <AppSettingsProvider>
              <ChatPage />
            </AppSettingsProvider>
          </SocketProvider>
        </ProtectedRoute>
      } />

      {/* Root: logged in → app, logged out → homepage */}
      <Route path="/" element={user ? <Navigate to="/app" replace /> : <Navigate to="/home" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}