import User from "../models/User.js";

/**
 * Get all users (for finding contacts)
 */
export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("username email preferredLanguage profilePicture status lastSeen")
      .sort({ username: 1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Search users by username
 */
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      username: { $regex: query, $options: "i" },
    })
      .select("username email preferredLanguage profilePicture status lastSeen")
      .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { preferredLanguage, profilePicture, email } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (preferredLanguage) updateData.preferredLanguage = preferredLanguage;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Update user status
 */
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user._id;

    if (!["online", "offline", "away"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          status,
          lastSeen: new Date(),
        },
      },
      { new: true }
    ).select("username status lastSeen");

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

