import bcrypt from "bcrypt";
import User from "../models/User.js";
import { createToken } from "../utils/token.js";
import { publicUser } from "../utils/user.js";

export async function signup(request, response) {
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

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      profilePicture: "",
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
}

export async function login(request, response) {
  const { email, password } = request.body;

  if (!email?.trim() || !password) {
    return response.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const passwordMatches = user
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
}

export function getCurrentUser(request, response) {
  response.json({ user: publicUser(request.user) });
}
