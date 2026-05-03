import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (token && user) {

      // ✅ PRODUCTION URL (NO localhost fallback)
      const SERVER_URL = process.env.REACT_APP_SERVER_URL || (process.env.NODE_ENV === "production" ? window.location.origin : "http://localhost:5000");

      socketRef.current = io(SERVER_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      // ✅ Events
      socketRef.current.on("connect", () => {
        console.log("✅ Socket connected:", socketRef.current.id);
      });

      socketRef.current.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      socketRef.current.on("onlineUsers", (users) => {
        setOnlineUsers(users);
      });

      socketRef.current.on("incomingCall", (data) => {
        setIncomingCall(data);
      });

      socketRef.current.on("callEnded", () => {
        setIncomingCall(null);
      });

      // Cleanup
      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [token, user]);

  const isOnline = (userId) =>
    onlineUsers.some(
      (u) => (u._id?.toString() || u) === userId?.toString()
    );

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        onlineUsers,
        isOnline,
        incomingCall,
        setIncomingCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);