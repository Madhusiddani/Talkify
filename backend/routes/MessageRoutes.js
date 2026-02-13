import express from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
  getConversation,
  updateMessageStatus,
  markConversationAsRead,
} from "../controllers/messageController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All message routes require authentication
router.use(authenticateToken);

// Message routes
router.post("/send", sendMessage);
router.get("/messages", getMessages);
router.patch("/messages/:messageId/status", updateMessageStatus);

// Conversation routes
router.get("/conversations", getConversations);
router.get("/conversations/:conversationId", getConversation);
router.patch("/conversations/:conversationId/read", markConversationAsRead);

export default router;
