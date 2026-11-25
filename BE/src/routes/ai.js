import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { improveDescription } from "../services/reportAssistant.js";

const router = express.Router();
router.post("/improve-description", requireAuth, async (request, response) => {
  const description = request.body?.description;
  if (typeof description !== "string" || description.trim().length < 10 || description.length > 5000) {
    return response.status(400).json({ message: "Enter a description between 10 and 5,000 characters for AI assistance." });
  }
  try {
    return response.json(await improveDescription(description.trim()));
  } catch (error) {
    return response.status(error.status || 500).json({ message: error.status ? error.message : "Could not improve the description." });
  }
});

export default router;
