const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const { protect } = require("../middleware/auth");

// ── Ensure recordings directory exists ───────────────────────────────────────
const RECORDINGS_DIR = path.join(__dirname, "..", "uploads", "recordings");
if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

// ── Multer storage for recordings ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RECORDINGS_DIR),
  filename:    (req, file, cb) => {
    const ts  = new Date().toISOString().replace(/[:.]/g, "-");
    const ext = path.extname(file.originalname) || ".webm";
    cb(null, `call-recording-${ts}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max
  fileFilter: (req, file, cb) => {
    // Accept audio and video blobs
    if (file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio/video files are accepted for recordings"));
    }
  },
});

// ── POST /api/recordings/save ─────────────────────────────────────────────────
// Body (multipart): recording (file), callType, contactName, duration
router.post("/save", protect, upload.single("recording"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No recording file received." });

    const { callType = "voice", contactName = "Unknown", duration = "0:00" } = req.body;

    const fileUrl = `/uploads/recordings/${req.file.filename}`;
    const meta = {
      userId:      req.user._id.toString(),
      username:    req.user.username,
      contactName,
      callType,
      duration,
      filename:    req.file.filename,
      fileUrl,
      fileSize:    req.file.size,
      createdAt:   new Date().toISOString(),
    };

    // Persist metadata as a small JSON sidecar next to the audio file
    const metaPath = path.join(RECORDINGS_DIR, req.file.filename.replace(/\.\w+$/, ".json"));
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    res.status(201).json({ recording: meta });
  } catch (err) {
    console.error("Recording save error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/recordings ───────────────────────────────────────────────────────
// Returns all recordings belonging to the authenticated user, newest first
router.get("/", protect, (req, res) => {
  try {
    const userId = req.user._id.toString();
    const files  = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith(".json"));

    const recordings = files
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(RECORDINGS_DIR, f), "utf8")); }
        catch { return null; }
      })
      .filter(r => r && r.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ recordings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/recordings/:filename ─────────────────────────────────────────
router.delete("/:filename", protect, (req, res) => {
  try {
    const userId   = req.user._id.toString();
    const metaPath = path.join(RECORDINGS_DIR, req.params.filename.replace(/\.\w+$/, ".json"));

    if (!fs.existsSync(metaPath)) return res.status(404).json({ message: "Recording not found." });

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    if (meta.userId !== userId) return res.status(403).json({ message: "Not your recording." });

    // Delete both the audio file and metadata
    const audioPath = path.join(RECORDINGS_DIR, meta.filename);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    fs.unlinkSync(metaPath);

    res.json({ message: "Recording deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;