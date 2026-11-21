import express from "express";
import jwt from "jsonwebtoken";
import { storeFile, removeFile, serverUrl, uploadsRoot } from "../config/storage.js";
import Project from "../models/Project.js";
import Submission from "../models/Submission.js";
import { requireAuth } from "../middleware/auth.js";
import { reportEvidenceUpload } from "../middleware/reportUpload.js";

const router = express.Router();
function evidenceUrl(submission, kind, request) {
  const storedPath = submission[`${kind}Path`];
  if (!storedPath?.startsWith("reports/")) return submission[`${kind}Url`] || "";
  const token = jwt.sign({ purpose: "evidence", submissionId: submission._id.toString(), kind },
    process.env.JWT_SECRET, { expiresIn: "1h", audience: "evidence-download" });
  return `${serverUrl(request)}/api/submissions/${submission._id}/files/${kind}?token=${encodeURIComponent(token)}`;
}

async function submissionResponse(submission, request) {

  return {
    id: submission._id,
    project: submission.project,
    bugHunter: submission.bugHunter,
    title: submission.title,
    description: submission.description,
    severity: submission.severity,
    status: submission.status,
    videoUrl: evidenceUrl(submission, "video", request),
    pdfUrl: evidenceUrl(submission, "pdf", request),
    bountyAmount: submission.bountyAmount,
    reviewNote: submission.reviewNote,
    reviewedAt: submission.reviewedAt,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

// These scoped links are issued only by authenticated, authorized report endpoints.
router.get("/:submissionId/files/:kind", async (request, response, next) => {
  const { submissionId, kind } = request.params;
  if (!["video", "pdf"].includes(kind) || !/^[a-f\d]{24}$/i.test(submissionId)) {
    return response.status(404).json({ message: "Evidence not found." });
  }
  try {
    const payload = jwt.verify(request.query.token, process.env.JWT_SECRET, {
      algorithms: ["HS256"], audience: "evidence-download",
    });
    if (payload.purpose !== "evidence" || payload.submissionId !== submissionId || payload.kind !== kind) {
      return response.status(401).json({ message: "Invalid evidence link." });
    }
  } catch {
    return response.status(401).json({ message: "Invalid or expired evidence link. Reload your reports." });
  }
  try {
    const submission = await Submission.findById(submissionId);
    const storedPath = submission?.[`${kind}Path`];
    if (!storedPath || !/^reports\/[a-f\d]{24}\/[a-f\d-]+\.(mp4|webm|mov|pdf)$/.test(storedPath)) {
      return response.status(404).json({ message: "Evidence not found." });
    }
    response.set("X-Content-Type-Options", "nosniff");
    response.set("Cache-Control", "private, no-store");
    response.set("Referrer-Policy", "no-referrer");
    return response.sendFile(storedPath, { root: uploadsRoot, dotfiles: "deny" }, (error) => {
      if (!error) return;
      if (response.headersSent) return next(error);
      return response.status(error.status === 404 ? 404 : 500).json({ message: "Could not load evidence file." });
    });
  } catch (error) {
    return next(error);
  }
});

router.use(requireAuth);

router.get("/mine", async (request, response) => {
  try {
    const submissions = await Submission.find({ bugHunter: request.user._id })
      .populate("project", "name domain bountyAmount")
      .sort({ createdAt: -1 });
    return response.json({
      submissions: await Promise.all(submissions.map((submission) => submissionResponse(submission, request))),
    });
  } catch (error) {
    console.error("Submission list failed:", error.message);
    return response.status(500).json({ message: "Could not load reports." });
  }
});

router.get("/project/:projectId", async (request, response) => {
  try {
    const project = await Project.findOne({
      _id: request.params.projectId,
      owner: request.user._id,
    });

    if (!project) {
      return response.status(403).json({
        message: "Only the project client can view these submissions.",
      });
    }

    const submissions = await Submission.find({ project: project._id })
      .populate("bugHunter", "name email")
      .sort({ createdAt: -1 });
    return response.json({
      submissions: await Promise.all(submissions.map((submission) => submissionResponse(submission, request))),
    });
  } catch (error) {
    console.error("Project submissions failed:", error.message);
    return response.status(500).json({ message: "Could not load project submissions." });
  }
});

router.post(
  "/project/:projectId",
  reportEvidenceUpload.fields([
    { name: "video", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  async (request, response) => {
    const { title, description, severity } = request.body;
    const files = request.files || {};
    const uploadedPaths = [];
    let saved = false;

    if (!title?.trim() || !description?.trim() || !severity) {
      return response.status(400).json({
        message: "Title, description, and severity are required.",
      });
    }

    if (!["low", "medium", "high", "critical"].includes(severity)) {
      return response.status(400).json({ message: "Invalid severity." });
    }

    if (!files.video?.[0] || !files.pdf?.[0]) {
      return response.status(400).json({ message: "A video and PDF are required." });
    }

    try {
      const project = await Project.findById(request.params.projectId);

      if (!project) {
        return response.status(404).json({ message: "Project not found." });
      }

      if (project.owner.toString() === request.user._id.toString()) {
        return response.status(403).json({
          message: "Project owners cannot submit reports to their own project.",
        });
      }

      const videoPath = await storeFile("reports", files.video[0], request.user._id);
      uploadedPaths.push(videoPath);
      const pdfPath = await storeFile("reports", files.pdf[0], request.user._id);
      uploadedPaths.push(pdfPath);

      const submission = await Submission.create({
        project: project._id,
        bugHunter: request.user._id,
        title: title.trim(),
        description: description.trim(),
        severity,
        videoPath,
        pdfPath,
        videoUrl: "",
        pdfUrl: "",
        bountyAmount: project.bountyAmount,
      });
      saved = true;

      return response.status(201).json({
        submission: await submissionResponse(submission, request),
      });
    } catch (error) {
      if (!saved) await Promise.all(uploadedPaths.map(removeFile));
      console.error("Submission creation failed:", error.message);
      return response.status(500).json({ message: "Could not submit report." });
    }
  },
);

router.patch("/:submissionId/review", async (request, response) => {
  try {
    const { status, reviewNote = "" } = request.body;

    if (!["approved", "rejected"].includes(status)) {
      return response.status(400).json({
        message: "Status must be approved or rejected.",
      });
    }

    const submission = await Submission.findById(request.params.submissionId)
      .populate("project");

    if (!submission) {
      return response.status(404).json({ message: "Submission not found." });
    }

    if (submission.project.owner.toString() !== request.user._id.toString()) {
      return response.status(403).json({
        message: "Only the project client can review this submission.",
      });
    }

    submission.status = status;
    submission.reviewNote = reviewNote.trim();
    submission.reviewedAt = new Date();
    submission.reviewedBy = request.user._id;
    await submission.save();

    return response.json({
      submission: await submissionResponse(submission, request),
    });
  } catch (error) {
    console.error("Submission review failed:", error.message);
    return response.status(500).json({ message: "Could not review submission." });
  }
});

export default router;
