import express from "express";
import { getSupportedLanguages } from "../services/translateService.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get supported languages (protected route)
router.get("/languages", authenticateToken, async (req, res) => {
  try {
    const languages = await getSupportedLanguages();
    res.json(languages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

