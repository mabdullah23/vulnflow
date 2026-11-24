import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const defaultProfilePicture = `${process.env.CLIENT_URL || "http://localhost:5173"}/images/neon-hooded-hacker.svg`;

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture || defaultProfilePicture,
    createdAt: user.createdAt,
  };
}

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured in BE/.env.");
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

router.post("/signup", async (request, response) => {
  const { username, email, password } = request.body;

  if (!username?.trim() || !email?.trim() || !password) {
    return response
      .status(400)
      .json({ message: "Username, email, and password are required." });
  }

  if (password.length < 8) {
    return response
      .status(400)
      .json({ message: "Password must be at least 8 characters." });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return response.status(409).json({ message: "Email is already registered." });
    }

    const user = await User.create({
      name: username.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
    });

    return response.status(201).json({
      token: createToken(user._id.toString()),
      user: publicUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({ message: "Email is already registered." });
    }
    return response.status(500).json({ message: "Could not create the account." });
  }
});

router.post("/login", async (request, response) => {
  const { email, password } = request.body;

  if (!email?.trim() || !password) {
    return response.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const passwordMatches = user?.password
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordMatches) {
      return response.status(401).json({ message: "Invalid email or password." });
    }

    return response.json({
      token: createToken(user._id.toString()),
      user: publicUser(user),
    });
  } catch {
    return response.status(500).json({ message: "Could not log in." });
  }
});

router.get("/me", requireAuth, (request, response) => {
  response.json({ user: publicUser(request.user) });
});

export default router;
