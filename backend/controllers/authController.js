// import User from "../models/User.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export const registerUser = async (req, res) => {
//   try {
//     let { username, password, preferredLanguage, email } = req.body;

//     // Trim inputs
//     username = username?.trim();
//     email = email?.trim();

//     console.log("📝 Registration attempt:", { username, hasPassword: !!password, preferredLanguage, email });

//     // Validation
//     if (!username || !password) {
//       console.log("❌ Validation failed: Missing username or password");
//       return res.status(400).json({ message: "Username and password are required" });
//     }

//     if (username.length < 3) {
//       console.log("❌ Validation failed: Username too short");
//       return res.status(400).json({ message: "Username must be at least 3 characters" });
//     }

//     if (password.length < 6) {
//       console.log("❌ Validation failed: Password too short");
//       return res.status(400).json({ message: "Password must be at least 6 characters" });
//     }

//     // Check if user already exists (only check email if provided)
//     const query = [{ username }];
//     if (email) {
//       query.push({ email });
//     }
//     const existingUser = await User.findOne({
//       $or: query
//     });

//     if (existingUser) {
//       console.log("❌ User already exists:", existingUser.username);
//       return res.status(400).json({ message: "Username or email already exists" });
//     }

//     const hashed = await bcrypt.hash(password, 10);
//     const newUser = new User({
//       username,
//       password: hashed,
//       preferredLanguage: preferredLanguage || "en",
//       email: email || undefined,
//     });

//     await newUser.save();
//     console.log("✅ User registered successfully:", newUser.username, "ID:", newUser._id.toString());

//     // Generate token
//     const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

//     res.status(201).json({
//       message: "User Registered Successfully",
//       token,
//       user: {
//         id: newUser._id.toString(),
//         username: newUser.username,
//         email: newUser.email,
//         preferredLanguage: newUser.preferredLanguage,
//         profilePicture: newUser.profilePicture || "",
//         status: newUser.status || "offline",
//       },
//     });
//   } catch (err) {
//     console.error("❌ Registration error:", err);
//     res.status(400).json({ message: err.message || "Registration failed" });
//   }
// };

// export const loginUser = async (req, res) => {
//   try {
//     let { username, password } = req.body;

//     // Trim username
//     username = username?.trim();

//     console.log("🔐 Login attempt for username:", username);

//     if (!username || !password) {
//       console.log("❌ Validation failed: Missing username or password");
//       return res.status(400).json({ message: "Username and password are required" });
//     }

//     const user = await User.findOne({ username });
//     if (!user) {
//       console.log("❌ User not found:", username);
//       return res.status(404).json({ message: "User Not Found" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       console.log("❌ Invalid password for user:", username);
//       return res.status(401).json({ message: "Invalid Credentials" });
//     }

//     // Update user status
//     user.status = "online";
//     user.lastSeen = new Date();
//     await user.save();

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
//     console.log("✅ Login successful for user:", username, "ID:", user._id.toString());

//     res.json({
//       token,
//       user: {
//         id: user._id.toString(),
//         username: user.username,
//         email: user.email,
//         preferredLanguage: user.preferredLanguage,
//         profilePicture: user.profilePicture || "",
//         status: user.status || "offline",
//       },
//     });
//   } catch (err) {
//     console.error("❌ Login error:", err);
//     res.status(400).json({ message: err.message || "Login failed" });
//   }
// };

// export const getCurrentUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select("-password");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json({
//       id: user._id.toString(),
//       username: user.username,
//       email: user.email,
//       preferredLanguage: user.preferredLanguage,
//       profilePicture: user.profilePicture || "",
//       status: user.status || "offline",
//     });
//   } catch (err) {
//     console.error("❌ Get current user error:", err);
//     res.status(400).json({ message: err.message || "Failed to get user" });
//   }
// };


import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * REGISTER USER
 */
export const registerUser = async (req, res) => {
  try {
    let { username, password, preferredLanguage, email } = req.body;

    // Trim inputs
    username = username?.trim();
    email = email?.trim();

    console.log("📝 Registration attempt:", username);

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        message: "Username must be at least 3 characters"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username },
        email ? { email } : null
      ].filter(Boolean)
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      preferredLanguage: preferredLanguage || "en",
      email: email || undefined,
      status: "offline"
    });

    await newUser.save();

    // Generate JWT
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ User registered:", newUser.username);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        preferredLanguage: newUser.preferredLanguage,
        profilePicture: newUser.profilePicture || "",
        status: newUser.status
      }
    });

  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({
      message: "Registration failed"
    });
  }
};

/**
 * LOGIN USER
 */
export const loginUser = async (req, res) => {
  try {
    let { username, password } = req.body;

    username = username?.trim();

    console.log("🔐 Login attempt:", username);

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // Update status
    user.status = "online";
    user.lastSeen = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Login successful:", username);

    res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        profilePicture: user.profilePicture || "",
        status: user.status
      }
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({
      message: "Login failed"
    });
  }
};

/**
 * GET CURRENT USER
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      preferredLanguage: user.preferredLanguage,
      profilePicture: user.profilePicture || "",
      status: user.status
    });

  } catch (err) {
    console.error("❌ Get current user error:", err);
    res.status(500).json({
      message: "Failed to fetch user"
    });
  }
};
