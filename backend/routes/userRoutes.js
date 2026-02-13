import express from "express";
import {
  getAllUsers,
  searchUsers,
  getUserById,
  updateProfile,
  updateStatus,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

router.get("/", getAllUsers);
router.get("/search", searchUsers);
router.get("/:userId", getUserById);
router.patch("/profile", updateProfile);
router.patch("/status", updateStatus);

export default router;

