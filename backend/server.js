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
const groupRoutes      = require("./routes/groups");

const { socketHandler } = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

// ✅ TRUST PROXY (important for Render)
app.set("trust proxy", 1);

// ✅ CORS FIX (production safe)
app.use(cors({
  origin: "*",   // You can restrict later to frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth",       authRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/messages",   messageRoutes);
app.use("/api/groups",     groupRoutes);
app.use("/api/ai",         aiRoutes);
app.use("/api/recordings", recordingRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Catch-all route to serve React app for non-API requests
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

// ✅ Socket.IO FIX
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket"]
});

// Attach socket
socketHandler(io);

// ✅ MongoDB connection (NO LOCAL FALLBACK)
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// Optional export
module.exports = { app, server, io };