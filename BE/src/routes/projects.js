import express from "express";
import Project, { supportedDomains } from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const scopeLabels = {
  web: "Website URL",
  api: "API documentation or base URL",
  cloud: "Cloud configuration details",
  network: "Authorized IP ranges and testing boundaries",
  "source-code": "Source code repository URL",
};

function projectResponse(project) {
  return {
    id: project._id,
    name: project.name,
    description: project.description,
    domain: project.domain,
    domainLabel: scopeLabels[project.domain],
    bountyAmount: project.bountyAmount,
    scope: project.scope,
    owner: project.owner,
    createdAt: project.createdAt,
  };
}

router.use(requireAuth);

router.post("/", async (request, response) => {
  const { name, description, domain, bountyAmount, scope } = request.body;

  if (!name?.trim() || !description?.trim() || !domain || !scope?.trim()) {
    return response.status(400).json({
      message: "Name, description, domain, and scope are required.",
    });
  }

  if (!supportedDomains.includes(domain)) {
    return response.status(400).json({ message: "That security domain is not supported yet." });
  }

  if (!Number.isFinite(Number(bountyAmount)) || Number(bountyAmount) < 0) {
    return response.status(400).json({ message: "Bounty must be a non-negative number." });
  }

  try {
    const project = await Project.create({
      name: name.trim(),
      description: description.trim(),
      domain,
      bountyAmount: Number(bountyAmount),
      scope: scope.trim(),
      owner: request.user._id,
    });
    return response.status(201).json({ project: projectResponse(project) });
  } catch (error) {
    console.error("Project creation failed:", error.message);
    return response.status(500).json({ message: "Could not create project." });
  }
});

router.get("/mine", async (request, response) => {
  try {
    const projects = await Project.find({ owner: request.user._id }).sort({ createdAt: -1 });
    return response.json({ projects: projects.map(projectResponse) });
  } catch (error) {
    console.error("Project list failed:", error.message);
    return response.status(500).json({ message: "Could not load projects." });
  }
});

router.get("/explore", async (request, response) => {
  try {
    const projects = await Project.find({
      owner: { $ne: request.user._id },
    }).sort({ createdAt: -1 });
    return response.json({ projects: projects.map(projectResponse) });
  } catch (error) {
    console.error("Explore projects list failed:", error.message);
    return response.status(500).json({ message: "Could not load projects." });
  }
});

router.patch("/:projectId", async (request, response) => {
  const { description, scope, bountyAmount } = request.body;
  if (typeof description !== "string" || !description.trim() ||
      typeof scope !== "string" || !scope.trim()) {
    return response.status(400).json({ message: "Description and scope are required." });
  }
  if (!["number", "string"].includes(typeof bountyAmount) ||
      String(bountyAmount).trim() === "" ||
      !Number.isFinite(Number(bountyAmount)) || Number(bountyAmount) < 0) {
    return response.status(400).json({ message: "Bounty must be a non-negative number." });
  }
  if (!/^[a-f\d]{24}$/i.test(request.params.projectId)) {
    return response.status(400).json({ message: "Invalid project ID." });
  }

  try {
    const project = await Project.findOneAndUpdate(
      { _id: request.params.projectId, owner: request.user._id },
      { $set: { description: description.trim(), scope: scope.trim(), bountyAmount: Number(bountyAmount) } },
      { new: true, runValidators: true },
    );
    if (!project) {
      return response.status(404).json({ message: "Project not found or you do not own it." });
    }
    return response.json({ project: projectResponse(project) });
  } catch (error) {
    console.error("Project update failed:", error.message);
    return response.status(500).json({ message: "Could not update project." });
  }
});

router.get("/:projectId", async (request, response) => {
  try {
    const project = await Project.findById(request.params.projectId);

    if (!project) {
      return response.status(404).json({ message: "Project not found." });
    }

    const isOwner = project.owner.toString() === request.user._id.toString();
    return response.json({
      project: projectResponse(project),
      permissions: { canSubmit: !isOwner, canReview: isOwner, canEdit: isOwner },
    });
  } catch (error) {
    console.error("Project details failed:", error.message);
    return response.status(500).json({ message: "Could not load project details." });
  }
});

export default router;
