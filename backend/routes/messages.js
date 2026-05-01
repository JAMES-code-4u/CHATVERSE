const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const { protect } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const router = express.Router();

// Ensure uploads directories exist
["uploads/images", "uploads/audio", "uploads/videos", "uploads/files"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const mimeType = file.mimetype;
    let dir = "uploads/files";
    if (mimeType.startsWith("image/")) dir = "uploads/images";
    else if (mimeType.startsWith("audio/")) dir = "uploads/audio";
    else if (mimeType.startsWith("video/")) dir = "uploads/videos";
    cb(null, dir);
  },
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/messages/send - send text message
router.post("/send", protect, async (req, res) => {
  try {
    const { receiverId, content, type = "text" } = req.body;
    if (!receiverId || !content)
      return res.status(400).json({ message: "receiverId and content required" });
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
      type,
    });
    await message.populate("sender", "username avatar");
    await message.populate("receiver", "username avatar");
    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages/upload - send file message
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId || !req.file)
      return res.status(400).json({ message: "receiverId and file required" });
    const mimeType = req.file.mimetype;
    let type = "file";
    let content = req.file.originalname;
    
    if (mimeType.startsWith("image/")) type = "image";
    else if (mimeType.startsWith("audio/")) {
      type = "audio";
      try {
        // Transcribe
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(req.file.path),
          model: 'whisper-1',
        });
        // Save transcription as message content
        if (transcription && transcription.text) {
          content = transcription.text;
        }
      } catch (error) {
        console.error("Audio transcription failed:", error);
      }
    }
    else if (mimeType.startsWith("video/")) type = "video";
    
    const fileUrl = `/${req.file.path.replace(/\\/g, "/")}`;
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content: content,
      type,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
    await message.populate("sender", "username avatar");
    await message.populate("receiver", "username avatar");
    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/unread/count
router.get("/unread/count", protect, async (req, res) => {
  try {
    const receiverId = new mongoose.Types.ObjectId(req.user._id);
    const counts = await Message.aggregate([
      { $match: { receiver: receiverId, read: false } },
      { $group: { _id: "$sender", count: { $sum: 1 } } },
    ]);
    res.json({ counts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/:userId - get conversation
router.get("/:userId", protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Check if it's a group
    const Group = require("../models/Group");
    const isGroup = await Group.exists({ _id: userId }).catch(() => false);

    let query;
    if (isGroup) {
      query = { receiverGroup: userId };
    } else {
      query = {
        $or: [
          { sender: req.user._id, receiver: userId },
          { sender: userId, receiver: req.user._id },
        ],
      };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("sender", "username avatar")
      .populate("receiver", "username avatar")
      .populate("reactions.user", "username avatar");

    // Mark messages as read (skip for groups for now)
    if (!isGroup) {
      await Message.updateMany(
        { sender: userId, receiver: req.user._id, read: false },
        { read: true, readAt: new Date() }
      );
    }

    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
