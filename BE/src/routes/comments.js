import express from "express";
import Comment from "../models/Comment.js";
import Submission from "../models/Submission.js";
import { requireAuth } from "../middleware/auth.js";
import { notifyReport } from "../services/notifications.js";

const router = express.Router();

router.route("/:submissionId/comments")
  .all(requireAuth, async (request, response, next) => {
    if (!/^[a-f\d]{24}$/i.test(request.params.submissionId)) {
      return response.status(400).json({ message: "Invalid report ID." });
    }
    try {
      const submission = await Submission.findById(request.params.submissionId).populate("project");
      if (!submission || !submission.project) {
        return response.status(404).json({ message: "Report not found." });
      }
      const userId = request.user._id.toString();
      if (submission.bugHunter.toString() !== userId && submission.project.owner.toString() !== userId) {
        return response.status(403).json({ message: "Only the researcher and project owner can view or add comments." });
      }
      request.submission = submission;
      return next();
    } catch {
      return response.status(500).json({ message: "Could not load report." });
    }
  })
  .get(async (request, response) => {
    try {
      const comments = await Comment.find({ submission: request.submission._id }).sort({ createdAt: 1, _id: 1 });
      return response.json({ comments });
    } catch {
      return response.status(500).json({ message: "Could not load comments." });
    }
  })
  .post(async (request, response) => {
    const { text } = request.body;
    if (typeof text !== "string" || !text.trim() || text.trim().length > 2000) {
      return response.status(400).json({ message: "Comment must be between 1 and 2000 characters." });
    }
    try {
      const submission = request.submission;
      const comment = await Comment.create({
        submission: submission._id, author: request.user._id,
        authorName: request.user.name, text: text.trim(),
      });
      const recipient = submission.bugHunter.toString() === request.user._id.toString()
        ? submission.project.owner : submission.bugHunter;
      await notifyReport(recipient, submission, `${request.user.name} replied on "${submission.title}".`);
      return response.status(201).json({ comment });
    } catch {
      return response.status(500).json({ message: "Could not add comment." });
    }
  });

export default router;
