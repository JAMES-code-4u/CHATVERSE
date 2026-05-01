const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

// Map: userId -> socketId (exported so routes can emit to specific users)
const onlineUsers = new Map();
const liveSessions = new Map();
let _io = null;
const getIo = () => _io;

const broadcastOnlineUsers = async () => {
  if (!_io) return;
  const ids = Array.from(onlineUsers.keys());
  const users = await User.find({ _id: { $in: ids } }).select("username avatar status");
  _io.emit("onlineUsers", users);
};

const socketHandler = (io) => {
  _io = io;
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

    // Join group rooms
    const Group = require("../models/Group");
    const userGroups = await Group.find({ members: userId }).catch(()=>[]);
    userGroups.forEach(g => {
      socket.join(g._id.toString());
    });

    // Broadcast online users list
    await broadcastOnlineUsers();

    // ─── CHAT MESSAGING ────────────────────────────────────────
    socket.on("sendMessage", async (data) => {
      try {
        const { receiverId, content, type = "text", fileUrl, fileName, fileSize, replyTo } = data;

        const isGroup = await Group.exists({ _id: receiverId }).catch(() => false);

        // Build message document
        const msgDoc = {
          sender:   userId,
          content,
          type,
          fileUrl:  fileUrl  || "",
          fileName: fileName || "",
          fileSize: fileSize || 0,
        };
        
        if (isGroup) {
          msgDoc.receiverGroup = receiverId;
        } else {
          msgDoc.receiver = receiverId;
        }

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
        if (!isGroup) await message.populate("receiver", "username avatar");

        if (isGroup) {
          // Broadcast to all group members (includes sender via room)
          io.to(receiverId).emit("receiveMessage", message);
          // Also send messageSent to sender so their bubble appears
          socket.emit("messageSent", message);
        } else {
          // Send to receiver if online
          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receiveMessage", message);
          }
          // Acknowledge sender with full persisted document
          socket.emit("messageSent", message);
        }
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ─── REACTIONS ──────────────────────────────────────────────
    socket.on("addReaction", async ({ messageId, emoji, receiverId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Check if user already reacted
        const existingIdx = message.reactions.findIndex(r => r.user.toString() === userId);
        if (existingIdx > -1) {
          if (message.reactions[existingIdx].emoji === emoji) {
            // Toggle off
            message.reactions.splice(existingIdx, 1);
          } else {
            // Change emoji
            message.reactions[existingIdx].emoji = emoji;
          }
        } else {
          // Add new
          message.reactions.push({ user: userId, emoji });
        }
        await message.save();
        await message.populate("reactions.user", "username avatar");

        // Broadcast to group or private user
        const isGroup = await Group.exists({ _id: receiverId }).catch(() => false);
        if (isGroup) {
          io.to(receiverId).emit("messageReaction", { messageId, reactions: message.reactions });
        } else {
          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId) io.to(receiverSocketId).emit("messageReaction", { messageId, reactions: message.reactions });
          socket.emit("messageReaction", { messageId, reactions: message.reactions }); // send to self
        }
      } catch (err) {
        console.error("Reaction setup error", err);
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

    // ─── LIVE BROADCASTING ──────────────────────────────────────
    socket.on("goLive", ({ hostId, hostName, type, title, viewers }) => {
      if (!hostId || hostId !== userId || !Array.isArray(viewers)) return;

      const session = {
        hostId,
        hostName: hostName || socket.user.username,
        type,
        title,
        viewers: viewers.map((viewerId) => viewerId.toString()),
        joinedViewers: [],
        startedAt: new Date().toISOString(),
      };

      liveSessions.set(hostId, session);

      session.viewers.forEach((viewerId) => {
        const targetSocketId = onlineUsers.get(viewerId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("liveNotification", session);
        }
      });
    });

    socket.on("joinLive", ({ hostId }) => {
      const session = liveSessions.get(hostId);
      if (!session || !session.viewers.includes(userId)) {
        socket.emit("liveUnavailable", { hostId });
        return;
      }

      if (!session.joinedViewers.includes(userId)) {
        session.joinedViewers.push(userId);
      }

      socket.emit("liveSessionStarted", {
        ...session,
        joinedViewers: session.joinedViewers,
      });

      const hostSocketId = onlineUsers.get(hostId);
      if (hostSocketId) {
        io.to(hostSocketId).emit("liveViewerJoined", {
          hostId,
          viewerId: userId,
          viewerName: socket.user.username,
          joinedViewers: session.joinedViewers,
        });
      }
    });

    socket.on("leaveLive", ({ hostId }) => {
      const session = liveSessions.get(hostId);
      if (!session) return;

      session.joinedViewers = session.joinedViewers.filter((id) => id !== userId);

      const hostSocketId = onlineUsers.get(hostId);
      if (hostSocketId) {
        io.to(hostSocketId).emit("liveViewerLeft", {
          hostId,
          viewerId: userId,
          joinedViewers: session.joinedViewers,
        });
      }
    });

    socket.on("requestLiveStream", ({ hostId }) => {
      const session = liveSessions.get(hostId);
      if (!session || session.type !== "video" || !session.viewers.includes(userId)) return;

      const hostSocketId = onlineUsers.get(hostId);
      if (hostSocketId) {
        io.to(hostSocketId).emit("liveStreamRequested", {
          hostId,
          viewerId: userId,
        });
      }
    });

    socket.on("liveOffer", ({ hostId, viewerId, signal }) => {
      if (!hostId || hostId !== userId || !viewerId || !signal) return;
      const viewerSocketId = onlineUsers.get(viewerId);
      if (viewerSocketId) {
        io.to(viewerSocketId).emit("liveOffer", { hostId, signal });
      }
    });

    socket.on("liveAnswer", ({ hostId, signal }) => {
      if (!hostId || !signal) return;
      const hostSocketId = onlineUsers.get(hostId);
      if (hostSocketId) {
        io.to(hostSocketId).emit("liveAnswer", {
          hostId,
          viewerId: userId,
          signal,
        });
      }
    });

    socket.on("endLive", ({ hostId }) => {
      const session = liveSessions.get(hostId);
      if (!session || hostId !== userId) return;

      session.viewers.forEach((viewerId) => {
        const targetSocketId = onlineUsers.get(viewerId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("liveEnded", {
            hostId,
            message: "Live ended. Thanks for watching! 👋",
          });
        }
      });

      liveSessions.delete(hostId);
    });

    socket.on("liveChatMsg", (msgData) => {
      const session = liveSessions.get(msgData?.hostId);
      if (!session) return;

      const recipients = new Set([session.hostId, ...session.joinedViewers]);
      recipients.forEach((participantId) => {
        const targetSocketId = onlineUsers.get(participantId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("liveChatMsg", {
            ...msgData,
            joinedViewers: session.joinedViewers,
          });
        }
      });
    });

    // ─── DISCONNECT ─────────────────────────────────────────────
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);

      liveSessions.forEach((session, hostId) => {
        if (hostId === userId) {
          session.viewers.forEach((viewerId) => {
            const targetSocketId = onlineUsers.get(viewerId);
            if (targetSocketId) {
              io.to(targetSocketId).emit("liveEnded", {
                hostId,
                message: "Live ended. Thanks for watching! 👋",
              });
            }
          });
          liveSessions.delete(hostId);
          return;
        }

        if (session.joinedViewers.includes(userId)) {
          session.joinedViewers = session.joinedViewers.filter((id) => id !== userId);
          const hostSocketId = onlineUsers.get(hostId);
          if (hostSocketId) {
            io.to(hostSocketId).emit("liveViewerLeft", {
              hostId,
              viewerId: userId,
              joinedViewers: session.joinedViewers,
            });
          }
        }
      });

      await User.findByIdAndUpdate(userId, { status: "offline", lastSeen: new Date() });
      await broadcastOnlineUsers();
      console.log(`🔴 ${socket.user.username} disconnected`);
    });
  });
};

module.exports = { socketHandler, onlineUsers, liveSessions, broadcastOnlineUsers };
