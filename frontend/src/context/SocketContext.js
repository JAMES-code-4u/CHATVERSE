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
      socketRef.current = io(
        process.env.REACT_APP_SERVER_URL || "http://localhost:5000",
        { auth: { token }, transports: ["websocket"] }
      );

      socketRef.current.on("onlineUsers", (users) => setOnlineUsers(users));

      socketRef.current.on("incomingCall", (data) => setIncomingCall(data));

      socketRef.current.on("callEnded", () => setIncomingCall(null));

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [token, user]);

  const isOnline = (userId) => onlineUsers.some(u => (u._id?.toString() || u) === userId?.toString());

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers, isOnline, incomingCall, setIncomingCall }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);