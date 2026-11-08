import mongoose from "mongoose";

const defaultProfilePicture = `${process.env.CLIENT_URL || "http://localhost:5173"}/images/neon-hooded-hacker.svg`;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: defaultProfilePicture,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", userSchema);
