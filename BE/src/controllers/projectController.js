import Project, { supportedDomains } from "../models/Project.js";

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

function validateProjectInput({ name, description, domain, bountyAmount, scope }) {
  if (!name?.trim() || !description?.trim() || !domain || !scope?.trim()) {
    return "Name, description, domain, and scope are required.";
  }

  if (!supportedDomains.includes(domain)) {
    return "That security domain is not supported yet.";
  }

  if (!Number.isFinite(Number(bountyAmount)) || Number(bountyAmount) < 0) {
    return "Bounty must be a non-negative number.";
  }

  return null;
}

export async function createProject(request, response) {
  const validationError = validateProjectInput(request.body);

  if (validationError) {
    return response.status(400).json({ message: validationError });
  }

  try {
    const project = await Project.create({
      name: request.body.name.trim(),
      description: request.body.description.trim(),
      domain: request.body.domain,
      bountyAmount: Number(request.body.bountyAmount),
      scope: request.body.scope.trim(),
      owner: request.user._id,
    });

    return response.status(201).json({ project: projectResponse(project) });
  } catch (error) {
    console.error("Project creation failed:", error.message);
    return response.status(500).json({ message: "Could not create project." });
  }
}

export async function getMyProjects(request, response) {
  try {
    const projects = await Project.find({ owner: request.user._id }).sort({
      createdAt: -1,
    });
    return response.json({ projects: projects.map(projectResponse) });
  } catch (error) {
    console.error("Project list failed:", error.message);
    return response.status(500).json({ message: "Could not load projects." });
  }
}

export async function getAllProjects(_request, response) {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    return response.json({ projects: projects.map(projectResponse) });
  } catch (error) {
    console.error("Explore projects list failed:", error.message);
    return response.status(500).json({ message: "Could not load projects." });
  }
}

export async function getProjectDetails(request, response) {
  try {
    const project = await Project.findById(request.params.projectId);

    if (!project) {
      return response.status(404).json({ message: "Project not found." });
    }

    return response.json({ project: projectResponse(project) });
  } catch (error) {
    console.error("Project details failed:", error.message);
    return response.status(500).json({ message: "Could not load project details." });
  }
}
