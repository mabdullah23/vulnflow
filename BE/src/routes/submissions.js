import express from "express";
import {
  createSubmission,
  getMySubmissions,
  getProjectSubmissions,
  reviewSubmission,
} from "../controllers/submissionController.js";
import { requireAuth } from "../middleware/auth.js";
import { reportEvidenceUpload } from "../middleware/reportUpload.js";

const router = express.Router();

router.use(requireAuth);
router.get("/mine", getMySubmissions);
router.get("/project/:projectId", getProjectSubmissions);
router.post(
  "/project/:projectId",
  reportEvidenceUpload.fields([
    { name: "video", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  createSubmission,
);
router.patch("/:submissionId/review", reviewSubmission);

export default router;
