import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: { 
      type: String, 
      unique: true, 
      sparse: true,
      lowercase: true,
      trim: true
    },
    password: { 
      type: String, 
      required: true 
    },
    preferredLanguage: { 
      type: String, 
      default: "en",
      required: true
    },
    profilePicture: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline"
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    socketId: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("User", userSchema);
