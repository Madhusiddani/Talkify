import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Ensure unique conversations between two users
// We'll handle uniqueness in the application logic since MongoDB array indexes work differently

// Helper method to get the other participant
conversationSchema.methods.getOtherParticipant = function(userId) {
  return this.participants.find(
    (id) => id.toString() !== userId.toString()
  );
};

export default mongoose.model("Conversation", conversationSchema);

