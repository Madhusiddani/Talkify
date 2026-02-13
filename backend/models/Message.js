import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    originalText: {
      type: String,
      required: true
    },
    sourceLanguage: {
      type: String,
      default: "auto"
    },
    translatedText: {
      type: String,
      required: true
    },
    targetLanguage: {
      type: String,
      required: true
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent"
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "audio"],
      default: "text"
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });

export default mongoose.model("Message", messageSchema);
