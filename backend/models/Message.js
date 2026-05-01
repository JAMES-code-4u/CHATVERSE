const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiverGroup: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    content: { type: String, default: "" },
    type: {
      type: String,
      enum: ["text", "image", "audio", "video", "file", "ai_voice", "sticker"],
      default: "text",
    },
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String },
      }
    ],
    // Reply-to: stores a snapshot of the original message so both sides see it
    replyTo: {
      type: new mongoose.Schema({
        messageId:  { type: String, default: "" },
        content:    { type: String, default: "" },
        type:       { type: String, default: "text" },
        senderName: { type: String, default: "" },
      }, { _id: false }),
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);