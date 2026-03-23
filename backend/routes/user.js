const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/avatars/"),
  filename: (req, file, cb) =>
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/users - search users
router.get("/", protect, async (req, res) => {
  try {
    const { search } = req.query;
    const query = search
      ? { _id: { $ne: req.user._id }, username: { $regex: search, $options: "i" } }
      : { _id: { $ne: req.user._id } };
    const users = await User.find(query).select("-password").limit(20);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/avatar
router.put("/avatar", protect, upload.single("avatar"), async (req, res) => {
  try {
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/contacts/:id - add contact
router.post("/contacts/:id", protect, async (req, res) => {
  try {
    const contact = await User.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: "User not found" });
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { contacts: req.params.id },
    });
    res.json({ message: "Contact added" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/contacts/list
router.get("/contacts/list", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("contacts", "-password");
    res.json({ contacts: user.contacts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;