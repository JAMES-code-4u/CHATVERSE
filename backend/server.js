require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes       = require("./routes/auth");
const userRoutes       = require("./routes/user");
const messageRoutes    = require("./routes/messages");
const aiRoutes         = require("./routes/ai");
const recordingRoutes  = require("./routes/recordings");

const { socketHandler } = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth",       authRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/messages",   messageRoutes);
app.use("/api/groups",     require("./routes/groups"));
app.use("/api/ai",         aiRoutes);
app.use("/api/recordings", recordingRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/chatverse")
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// Socket.io handler
socketHandler(io);

module.exports = { app, server, io };