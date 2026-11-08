import { randomUUID } from "node:crypto";
import { supabase } from "../config/supabase.js";
import User from "../models/User.js";
import { publicUser } from "../utils/user.js";

const bucketName = "profile-images";

export async function updateProfile(request, response) {
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

      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      updates.profilePicture = data.publicUrl;
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
}
