import Notification from "../models/Notification.js";

export async function notifyReport(recipient, submission, message) {
  try {
    await Notification.create({ recipient, submission: submission._id, message });
  } catch (error) {
    // A notification failure must not make a saved report/comment look unsaved.
    console.error("Notification failed:", error.message);
  }
}
