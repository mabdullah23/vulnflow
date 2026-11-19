import { useEffect, useState } from "react";
import ProjectDetails from "./ProjectDetails.jsx";
import { authRequest, tokenKey } from "../services/authApi.js";

function ExploreProjects() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authRequest("/api/projects/explore", {
      token: localStorage.getItem(tokenKey),
    })
      .then((data) => setProjects(data.projects))
      .catch((requestError) => setError(requestError.message));
  }, []);

  if (selectedProjectId) {
    return (
      <ProjectDetails
        projectId={selectedProjectId}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  return (
    <section className="page-card">
      <p className="page-path">~/ explore</p>
      <h1>Explore Projects</h1>
      <p>Discover security programs and choose a project to review.</p>
      {error && <p className="error">{error}</p>}
      {!error && projects.length === 0 && (
        <p className="empty-state">No projects are available yet.</p>
      )}
      <div className="project-grid">
        {projects.map((project) => (
          <button
            className="explore-item"
            type="button"
            key={project.id}
            onClick={() => setSelectedProjectId(project.id)}
          >
            <span className="explore-title">{project.name}</span>
            <span className="explore-domain">{project.domainLabel}</span>
            <span className="bounty">${project.bountyAmount} bounty</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ExploreProjects;
