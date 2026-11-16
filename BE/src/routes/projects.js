import express from "express";
import {
  createProject,
  getAllProjects,
  getMyProjects,
  getProjectDetails,
} from "../controllers/projectController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);
router.post("/", createProject);
router.get("/mine", getMyProjects);
router.get("/explore", getAllProjects);
router.get("/:projectId", getProjectDetails);

export default router;
