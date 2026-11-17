import { randomUUID } from "node:crypto";
import express from "express";
import { supabase } from "../config/supabase.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { profileImageUpload } from "../middleware/upload.js";

const router = express.Router();
const bucketName = "profile-images";
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
        const extension = request.file.originalname.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `${request.user._id}/${randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, request.file.buffer, {
            contentType: request.file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("Profile image upload failed:", uploadError.message);
          return response.status(502).json({ message: "Could not upload profile image." });
        }

        updates.profilePicture = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath).data.publicUrl;
      }

      if (!Object.keys(updates).length) {
        return response.status(400).json({ message: "Provide a name or profile image." });
      }

      const user = await User.findByIdAndUpdate(request.user._id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");

      return response.json({ user: publicUser(user) });
    } catch (error) {
      console.error("Profile update failed:", error.message);
      return response.status(500).json({ message: "Could not update profile." });
    }
  },
);

export default router;
