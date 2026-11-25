import express from "express";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (request, response) => {
  try {
    const recipient = request.user._id;
    const notifications = await Notification.find({ recipient }).sort({ createdAt: -1 }).limit(30);
    const unreadCount = await Notification.countDocuments({ recipient, read: false });
    return response.json({
      notifications: notifications.map((item) => ({
        id: item._id, message: item.message, read: item.read, createdAt: item.createdAt,
      })),
      unreadCount,
    });
  } catch {
    return response.status(500).json({ message: "Could not load notifications." });
  }
});

router.patch("/read", async (request, response) => {
  try {
    await Notification.updateMany({ recipient: request.user._id, read: false }, { $set: { read: true } });
    return response.json({ message: "Notifications marked as read." });
  } catch {
    return response.status(500).json({ message: "Could not mark notifications as read." });
  }
});

export default router;
