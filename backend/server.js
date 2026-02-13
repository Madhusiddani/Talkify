import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";
import { translateText } from "./services/translateService.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/MessageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import translateRoutes from "./routes/translateRoutes.js";

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

// Socket.io configuration with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/translate", translateRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Talkify API is running" });
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.userId = user._id.toString();
    socket.username = user.username;
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
});

  // Store active users (userId -> socketId)
  const activeUsers = new Map();

  // WebSocket Connection
  io.on("connection", async (socket) => {
    const userId = socket.userId;
    const username = socket.username;
    const userIdStr = userId.toString(); // Ensure string format

    console.log(`🔗 User Connected: ${username} (${userIdStr}) - Socket: ${socket.id}`);

    // Store user's socket ID (use string key for consistency)
    activeUsers.set(userIdStr, socket.id);
    console.log(`📊 Active users count: ${activeUsers.size}`);

  // Update user status to online
  await User.findByIdAndUpdate(userId, {
    status: "online",
    socketId: socket.id,
    lastSeen: new Date(),
  });

  // Join user's personal room (use string ID for consistency)
  socket.join(`user:${userIdStr}`);

  // Notify others that user is online
  socket.broadcast.emit("userOnline", { userId: userIdStr, username });

  // Handle sending messages via Socket.io
  socket.on("sendMessage", async (data) => {
    try {
      const { receiverId, text, messageType = "text" } = data;

      if (!receiverId || !text) {
        socket.emit("error", { message: "Receiver ID and text are required" });
        return;
      }

      // Get receiver - ensure receiverId is valid (convert to string for consistency)
      const receiverIdStr = String(receiverId);
      const receiver = await User.findById(receiverIdStr);
      if (!receiver) {
        console.error(`❌ Receiver not found: ${receiverIdStr}`);
        socket.emit("error", { message: "Receiver not found" });
        return;
      }
      
      console.log(`📨 Message from ${userIdStr} (${username}) to ${receiverIdStr} (${receiver.username}): "${text.substring(0, 50)}..."`);

      // Get sender
      const sender = await User.findById(userId);
      if (!sender) {
        socket.emit("error", { message: "Sender not found" });
        return;
      }

      const targetLang = receiver.preferredLanguage || "en";

      // Translate message - use "auto" to detect source language from text
      let translation;
      try {
        translation = await translateText(text, targetLang, "auto");
        console.log(`✅ Translation successful: ${translation.sourceLanguage} → ${translation.targetLanguage}`);
      } catch (translateError) {
        console.error("❌ Translation error:", translateError);
        // Fallback to original text if translation fails
        translation = {
          translatedText: text,
          sourceLanguage: "en",
          targetLanguage: targetLang,
        };
      }

      // Get or create conversation
      // MongoDB needs ObjectIds, but we can pass strings and Mongoose will convert
      const participants = [userId, receiverIdStr].sort((a, b) =>
        a.toString().localeCompare(b.toString())
      );

      let conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 },
      });

      if (!conversation) {
        conversation = new Conversation({
          participants,
          unreadCount: new Map(),
        });
        await conversation.save();
      }

      // Create message (use ObjectId strings)
      const message = new Message({
        sender: userId, // MongoDB will convert string to ObjectId
        receiver: receiverIdStr, // MongoDB will convert string to ObjectId
        originalText: text,
        sourceLanguage: translation.sourceLanguage,
        translatedText: translation.translatedText,
        targetLanguage: translation.targetLanguage,
        conversationId: conversation._id,
        messageType,
        status: "sent",
      });

      await message.save();

      // Update conversation
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();
      const currentUnread = conversation.unreadCount.get(receiverIdStr) || 0;
      conversation.unreadCount.set(receiverIdStr, currentUnread + 1);
      await conversation.save();

      // Populate message
      await message.populate("sender", "username profilePicture");
      await message.populate("receiver", "username profilePicture");

      // Convert message to JSON object for socket emission
      const messageObj = message.toObject();
      messageObj._id = messageObj._id.toString();
      messageObj.createdAt = messageObj.createdAt.toISOString();
      messageObj.updatedAt = messageObj.updatedAt.toISOString();
      
      if (messageObj.sender && messageObj.sender._id) {
        messageObj.sender._id = messageObj.sender._id.toString();
      }
      if (messageObj.receiver && messageObj.receiver._id) {
        messageObj.receiver._id = messageObj.receiver._id.toString();
      }

      console.log(`✅ Message created:`, {
        id: messageObj._id,
        sender: messageObj.sender?.username,
        receiver: messageObj.receiver?.username,
        originalText: messageObj.originalText.substring(0, 30),
        translatedText: messageObj.translatedText.substring(0, 30),
        conversationId: conversation._id.toString()
      });

      // Emit to sender (confirmation) - ALWAYS emit this
      console.log(`📤 Emitting messageSent to sender: ${userIdStr}`);
      socket.emit("messageSent", {
        message: messageObj,
        conversationId: conversation._id.toString(),
      });

      // Emit to receiver (if online) - receiverIdStr already set above
      const receiverSocketId = activeUsers.get(receiverIdStr);
      
      console.log(`📤 Sending message from ${userIdStr} to ${receiverIdStr}`);
      console.log(`🔍 Active users:`, Array.from(activeUsers.keys()));
      console.log(`🔍 Looking for receiver: ${receiverIdStr}, Found socket: ${receiverSocketId}`);
      
      if (receiverSocketId) {
        console.log(`✅ Receiver is online, emitting newMessage to socket: ${receiverSocketId}`);
        io.to(receiverSocketId).emit("newMessage", {
          message: messageObj,
          conversationId: conversation._id.toString(),
        });

        // Update message status to delivered
        message.status = "delivered";
        await message.save();
        console.log(`✅ Message status updated to delivered`);
      } else {
        console.log(`⚠️ Receiver ${receiverIdStr} is offline, message saved for later`);
        // Message is already saved, receiver will see it when they come online
      }

      // Emit conversation update to both users
      io.to(`user:${userIdStr}`).to(`user:${receiverIdStr}`).emit("conversationUpdated", {
        conversationId: conversation._id.toString(),
        lastMessage: messageObj,
        lastMessageAt: conversation.lastMessageAt,
      });
    } catch (error) {
      console.error("Send Message Error:", error);
      socket.emit("error", { message: error.message });
    }
  });

  // Handle typing indicator
  socket.on("typing", (data) => {
    const { receiverId, isTyping } = data;
    const receiverIdStr = receiverId.toString();
    const receiverSocketId = activeUsers.get(receiverIdStr);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        userId: userIdStr,
        username,
        isTyping,
      });
    }
  });

  // Handle message read status
  socket.on("markAsRead", async (data) => {
    try {
      const { messageId, conversationId } = data;

      const message = await Message.findById(messageId);
      if (!message || message.receiver.toString() !== userId) {
        return;
      }

      message.status = "read";
      await message.save();

      // Update conversation unread count
      if (conversationId) {
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          const currentUnread = conversation.unreadCount.get(userId) || 0;
          if (currentUnread > 0) {
            conversation.unreadCount.set(userId, Math.max(0, currentUnread - 1));
            await conversation.save();
          }
        }
      }

      // Notify sender
      const senderSocketId = activeUsers.get(message.sender.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageRead", {
          messageId,
          conversationId,
        });
      }
    } catch (error) {
      console.error("Mark as Read Error:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    const userIdStr = userId.toString();
    console.log(`❌ User Disconnected: ${username} (${userIdStr})`);

    // Remove from active users
    activeUsers.delete(userIdStr);
    console.log(`📊 Active users count after disconnect: ${activeUsers.size}`);

    // Update user status to offline
    await User.findByIdAndUpdate(userId, {
      status: "offline",
      lastSeen: new Date(),
      socketId: "",
    });

    // Notify others that user is offline
    socket.broadcast.emit("userOffline", { userId: userIdStr, username });
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
});
