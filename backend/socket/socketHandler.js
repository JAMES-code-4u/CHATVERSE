const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

// Map: userId -> socketId
const onlineUsers = new Map();

const socketHandler = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    console.log(`🟢 ${socket.user.username} connected [${socket.id}]`);

    // Update user status to online
    await User.findByIdAndUpdate(userId, { status: "online" });

    // Broadcast online users list
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    // ─── CHAT MESSAGING ────────────────────────────────────────
    socket.on("sendMessage", async (data) => {
      try {
        const { receiverId, content, type = "text", fileUrl, fileName, fileSize, replyTo } = data;

        // Build message document
        const msgDoc = {
          sender:   userId,
          receiver: receiverId,
          content,
          type,
          fileUrl:  fileUrl  || "",
          fileName: fileName || "",
          fileSize: fileSize || 0,
        };

        // Attach reply snapshot if provided
        if (replyTo && replyTo.content) {
          msgDoc.replyTo = {
            messageId:  replyTo.messageId  || "",
            content:    replyTo.content,
            type:       replyTo.type       || "text",
            senderName: replyTo.senderName || "",
          };
        }

        const message = await Message.create(msgDoc);
        await message.populate("sender",   "username avatar");
        await message.populate("receiver", "username avatar");

        // Send to receiver if online (includes full replyTo so they see it too)
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", message);
        }
        // Acknowledge sender with full persisted document
        socket.emit("messageSent", message);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("markRead", async ({ senderId }) => {
      await Message.updateMany(
        { sender: senderId, receiver: userId, read: false },
        { read: true, readAt: new Date() }
      );
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", { by: userId });
      }
    });

    socket.on("typing", ({ receiverId, isTyping }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", { userId, isTyping });
      }
    });

    // ─── WEBRTC SIGNALING (Video / Voice Calls) ─────────────────
    socket.on("callUser", ({ userToCall, signalData, from, callType }) => {
      const receiverSocketId = onlineUsers.get(userToCall);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("incomingCall", {
          signal: signalData,
          from,
          callType, // "video" | "voice"
          callerInfo: {
            id: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar,
          },
        });
      } else {
        socket.emit("callFailed", { reason: "User is offline" });
      }
    });

    socket.on("answerCall", ({ to, signal }) => {
      const callerSocketId = onlineUsers.get(to);
      if (callerSocketId) {
        io.to(callerSocketId).emit("callAccepted", { signal });
      }
    });

    socket.on("rejectCall", ({ to }) => {
      const callerSocketId = onlineUsers.get(to);
      if (callerSocketId) io.to(callerSocketId).emit("callRejected");
    });

    socket.on("endCall", ({ to }) => {
      const otherSocketId = onlineUsers.get(to);
      if (otherSocketId) io.to(otherSocketId).emit("callEnded");
    });

    socket.on("iceCandidate", ({ to, candidate }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("iceCandidate", { candidate });
      }
    });

    // Screen sharing toggle signal
    socket.on("screenShare", ({ to, sharing }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("screenShare", { sharing, from: userId });
      }
    });

    // ─── DISCONNECT ─────────────────────────────────────────────
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { status: "offline", lastSeen: new Date() });
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      console.log(`🔴 ${socket.user.username} disconnected`);
    });
  });
};

module.exports = { socketHandler, onlineUsers };