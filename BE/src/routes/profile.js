import express from "express";
import { storeFile, removeFile, serverUrl } from "../config/storage.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { profileImageUpload } from "../middleware/upload.js";

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

router.patch(
  "/",
  requireAuth,
  profileImageUpload.single("profileImage"),
  async (request, response) => {
    let uploadedPath;
    let saved = false;
    try {
      const { name } = request.body;
      const updates = {};

      if (name !== undefined) {
        if (!name.trim()) {
          return response.status(400).json({ message: "Username cannot be empty." });
        }
        updates.name = name.trim();
      }

      if (request.file) {
        uploadedPath = await storeFile("profile-images", request.file, request.user._id);
        updates.profilePicture = `${serverUrl(request)}/uploads/${uploadedPath}`;
      }

      if (!Object.keys(updates).length) {
        return response.status(400).json({ message: "Provide a name or profile image." });
      }

      const user = await User.findByIdAndUpdate(request.user._id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");
      if (!user) throw new Error("User no longer exists.");
      saved = true;

      const oldImage = request.user.profilePicture || "";
      const prefix = `${serverUrl(request)}/uploads/profile-images/`;
      if (uploadedPath && oldImage.startsWith(prefix)) {
        const oldPath = oldImage.slice(`${serverUrl(request)}/uploads/`.length);
        if (/^profile-images\/[a-f\d]{24}\/[a-f\d-]+\.(jpg|png|webp|gif)$/.test(oldPath)) {
          await removeFile(oldPath);
        }
      }

      return response.json({ user: publicUser(user) });
    } catch (error) {
      if (!saved) await removeFile(uploadedPath);
      console.error("Profile update failed:", error.message);
      return response.status(500).json({ message: "Could not update profile." });
    }
  },
);

export default router;
