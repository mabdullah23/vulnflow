import express from "express";
import { updateProfile } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";
import { profileImageUpload } from "../middleware/upload.js";

const router = express.Router();

router.patch(
  "/",
  requireAuth,
  profileImageUpload.single("profileImage"),
  updateProfile,
);

export default router;
