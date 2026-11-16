import { useEffect, useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";

function ProjectDetails({ projectId, onBack }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authRequest(`/api/projects/${projectId}`, {
      token: localStorage.getItem(tokenKey),
    })
      .then(setDetails)
      .catch((requestError) => setError(requestError.message));
  }, [projectId]);

  if (error) {
    return <section className="page-card"><p className="error">{error}</p><button type="button" onClick={onBack}>Back to projects</button></section>;
  }

  if (!details) {
    return <section className="page-card"><p>Loading project...</p></section>;
  }

  const { project } = details;

  return (
    <section className="page-card">
      <button className="back-button" type="button" onClick={onBack}>← Back to projects</button>
      <div className="page-heading">
        <div>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
        <span className="bounty">${project.bountyAmount} bounty</span>
      </div>
      <div className="program-meta">
        <strong>Domain</strong><span>{project.domainLabel}</span>
        <strong>Scope</strong><span>{project.scope}</span>
      </div>
      <div className="empty-state project-submissions-placeholder">
        Submissions will be available in a future update.
      </div>
    </section>
  );
}

export default ProjectDetails;
