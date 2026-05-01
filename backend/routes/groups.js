const express = require("express");
const mongoose = require("mongoose");
const Group = require("../models/Group");
const { protect } = require("../middleware/auth");
const { onlineUsers, getIo } = require("../socket/socketHandler");
const router = express.Router();

// Helper to format group for frontend
const formatGroup = (group) => ({
  _id: group._id,
  username: group.name,
  avatar: group.avatar || null,
  isGroup: true,
  members: group.members.map(m => (m._id ? m._id.toString() : m.toString())),
  admin: group.admin,
});

// POST /api/groups - Create a group
router.post("/", protect, async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ message: "Group name and members array required" });
    }

    // Ensure the creator is in the members list
    const memberIds = [...new Set([...members, req.user._id.toString()])];

    const group = await Group.create({
      name,
      admin: req.user._id,
      members: memberIds,
    });

    await group.populate("members", "username avatar status");

    const groupContact = formatGroup(group);
    const io = getIo();

    // Notify every online member about the new group so their UI updates instantly
    if (io) {
      memberIds.forEach(memberId => {
        const socketId = onlineUsers.get(memberId);
        if (socketId) {
          // Make that user's socket join the group room
          const memberSocket = io.sockets.sockets.get(socketId);
          if (memberSocket) memberSocket.join(group._id.toString());
          // Send the new group data to their frontend
          io.to(socketId).emit("groupCreated", groupContact);
        }
      });
    }

    res.status(201).json({ group: groupContact });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups - Get all groups for the user
router.get("/", protect, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).populate("members", "username avatar status");
    res.json({ groups: groups.map(formatGroup) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
