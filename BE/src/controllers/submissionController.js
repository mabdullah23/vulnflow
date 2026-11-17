import { randomUUID } from "node:crypto";
import { supabase } from "../config/supabase.js";
import Project from "../models/Project.js";
import Submission from "../models/Submission.js";

const videoBucket = "report-evidence";
const pdfBucket = "bounty-attachments";

async function signedEvidenceUrl(bucket, path, fallbackUrl) {
  if (!path) {
    return fallbackUrl;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    throw new Error(`Could not create a secure ${bucket} link.`);
  }

  return data.signedUrl;
}

function getStoredPath(url, bucket) {
  if (!url) {
    return "";
  }

  const marker = `/object/public/${bucket}/`;
  const markerIndex = url.indexOf(marker);
  return markerIndex === -1
    ? ""
    : decodeURIComponent(url.slice(markerIndex + marker.length));
}

async function submissionResponse(submission) {
  const videoPath = submission.videoPath || getStoredPath(submission.videoUrl, videoBucket);
  const pdfPath = submission.pdfPath || getStoredPath(submission.pdfUrl, pdfBucket);

  return {
    id: submission._id,
    project: submission.project,
    bugHunter: submission.bugHunter,
    title: submission.title,
    description: submission.description,
    severity: submission.severity,
    status: submission.status,
    videoUrl: await signedEvidenceUrl(videoBucket, videoPath, submission.videoUrl),
    pdfUrl: await signedEvidenceUrl(pdfBucket, pdfPath, submission.pdfUrl),
    bountyAmount: submission.bountyAmount,
    reviewNote: submission.reviewNote,
    reviewedAt: submission.reviewedAt,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

function validateSubmissionInput({ title, description, severity }) {
  if (!title?.trim() || !description?.trim() || !severity) {
    return "Title, description, and severity are required.";
  }

  if (!["low", "medium", "high", "critical"].includes(severity)) {
    return "Invalid severity.";
  }

  return null;
}

async function uploadFile(bucket, file, ownerId) {
  const extension = file.originalname.split(".").pop()?.toLowerCase() || "bin";
  const path = `${ownerId}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new Error(`Could not upload ${bucket} evidence.`);
  }

  return path;
}

export async function createSubmission(request, response) {
  const validationError = validateSubmissionInput(request.body);
  const files = request.files || {};

  if (validationError) {
    return response.status(400).json({ message: validationError });
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
      return response.status(403).json({ message: "Project owners cannot submit reports to their own project." });
    }

    const [videoPath, pdfPath] = await Promise.all([
      uploadFile(videoBucket, files.video[0], request.user._id),
      uploadFile(pdfBucket, files.pdf[0], request.user._id),
    ]);

    const submission = await Submission.create({
      project: project._id,
      bugHunter: request.user._id,
      title: request.body.title.trim(),
      description: request.body.description.trim(),
      severity: request.body.severity,
      videoPath,
      pdfPath,
      videoUrl: "",
      pdfUrl: "",
      bountyAmount: project.bountyAmount,
    });

    return response.status(201).json({
      submission: await submissionResponse(submission),
    });
  } catch (error) {
    console.error("Submission creation failed:", error.message);
    return response.status(500).json({ message: "Could not submit report." });
  }
}

export async function getMySubmissions(request, response) {
  try {
    const submissions = await Submission.find({ bugHunter: request.user._id })
      .populate("project", "name domain bountyAmount")
      .sort({ createdAt: -1 });
    return response.json({
      submissions: await Promise.all(submissions.map(submissionResponse)),
    });
  } catch (error) {
    console.error("Submission list failed:", error.message);
    return response.status(500).json({ message: "Could not load reports." });
  }
}

export async function getProjectSubmissions(request, response) {
  try {
    const project = await Project.findOne({
      _id: request.params.projectId,
      owner: request.user._id,
    });

    if (!project) {
      return response.status(403).json({ message: "Only the project client can view these submissions." });
    }

    const submissions = await Submission.find({ project: project._id })
      .populate("bugHunter", "name email")
      .sort({ createdAt: -1 });
    return response.json({
      submissions: await Promise.all(submissions.map(submissionResponse)),
    });
  } catch (error) {
    console.error("Project submissions failed:", error.message);
    return response.status(500).json({ message: "Could not load project submissions." });
  }
}

export async function reviewSubmission(request, response) {
  try {
    const { status, reviewNote = "" } = request.body;

    if (!["approved", "rejected"].includes(status)) {
      return response.status(400).json({ message: "Status must be approved or rejected." });
    }

    const submission = await Submission.findById(request.params.submissionId).populate("project");

    if (!submission) {
      return response.status(404).json({ message: "Submission not found." });
    }

    if (submission.project.owner.toString() !== request.user._id.toString()) {
      return response.status(403).json({ message: "Only the project client can review this submission." });
    }

    submission.status = status;
    submission.reviewNote = reviewNote.trim();
    submission.reviewedAt = new Date();
    submission.reviewedBy = request.user._id;
    await submission.save();

    return response.json({
      submission: await submissionResponse(submission),
    });
  } catch (error) {
    console.error("Submission review failed:", error.message);
    return response.status(500).json({ message: "Could not review submission." });
  }
}
