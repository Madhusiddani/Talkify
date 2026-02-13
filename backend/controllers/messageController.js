import Message from "../models/Message.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import { translateText } from "../services/translateService.js";

/**
 * Get or create a conversation between two users
 */
const getOrCreateConversation = async (user1Id, user2Id) => {
  // Sort IDs to ensure consistent conversation lookup
  const participants = [user1Id, user2Id].sort((a, b) => 
    a.toString().localeCompare(b.toString())
  );

  let conversation = await Conversation.findOne({
    participants: { $all: participants, $size: 2 },
  }).populate("participants", "username preferredLanguage profilePicture");

  if (!conversation) {
    conversation = new Conversation({
      participants,
      unreadCount: new Map(),
    });
    await conversation.save();
    await conversation.populate("participants", "username preferredLanguage profilePicture");
  }

  return conversation;
};

/**
 * Send a message
 */
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, messageType = "text" } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !text) {
      return res.status(400).json({ message: "Receiver ID and text are required" });
    }

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Get sender's preferred language (for detecting source language)
    const sender = await User.findById(senderId);
    const senderLang = sender.preferredLanguage || "en";

    // Get receiver's preferred language (target language)
    const targetLang = receiver.preferredLanguage || "en";

    // Translate the message
    const translation = await translateText(text, targetLang, senderLang);

    // Get or create conversation
    const conversation = await getOrCreateConversation(senderId, receiverId);

    // Create message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      originalText: text,
      sourceLanguage: translation.sourceLanguage,
      translatedText: translation.translatedText,
      targetLanguage: translation.targetLanguage,
      conversationId: conversation._id,
      messageType,
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    
    // Update unread count for receiver
    const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    
    await conversation.save();

    // Populate message with user details
    await message.populate("sender", "username profilePicture");
    await message.populate("receiver", "username profilePicture");

    res.status(201).json({
      message,
      conversation: {
        id: conversation._id,
        participants: conversation.participants,
        lastMessage: message,
        lastMessageAt: conversation.lastMessageAt,
      },
    });
  } catch (err) {
    console.error("Send Message Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (req, res) => {
  try {
    const { conversationId, page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get messages
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await Message.find({ conversationId })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Reset unread count for this user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Message.countDocuments({ conversationId }),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get all conversations for the current user
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username preferredLanguage profilePicture status lastSeen")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    // Format conversations to exclude current user from participants list
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return {
        id: conv._id,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.unreadCount.get(userId.toString()) || 0,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    res.json(formattedConversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a specific conversation
 */
export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId)
      .populate("participants", "username preferredLanguage profilePicture status lastSeen")
      .populate("lastMessage");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const otherParticipant = conversation.participants.find(
      (p) => p._id.toString() !== userId.toString()
    );

    res.json({
      id: conversation._id,
      participant: otherParticipant,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: conversation.unreadCount.get(userId.toString()) || 0,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update message status (delivered/read)
 */
export const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!["delivered", "read"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only receiver can update status
    if (message.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    message.status = status;
    await message.save();

    // If status is read, update conversation unread count
    if (status === "read") {
      const conversation = await Conversation.findById(message.conversationId);
      if (conversation) {
        const currentUnread = conversation.unreadCount.get(userId.toString()) || 0;
        if (currentUnread > 0) {
          conversation.unreadCount.set(userId.toString(), Math.max(0, currentUnread - 1));
          await conversation.save();
        }
      }
    }

    res.json({ message: "Status updated successfully", updatedMessage: message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Mark all messages in a conversation as read
 */
export const markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update all messages to read
    await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        status: { $ne: "read" },
      },
      { $set: { status: "read" } }
    );

    // Reset unread count
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    res.json({ message: "Conversation marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
