import { useEffect, useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";

function ProjectDetails({ projectId, onBack }) {
  const [details, setDetails] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
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

  const { project, submissions } = details;

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
      <h2 className="section-title">Submissions</h2>
      <p className="muted">These are dummy submissions for now. File attachments are not enabled.</p>
      <div className="item-list">
        {submissions.map((submission) => (
          <button className="submission-item" type="button" key={submission.id} onClick={() => setSelectedSubmission(submission)}>
            <span><strong>{submission.title}</strong><small>{submission.researcher}</small></span>
            <span className={`badge badge-${submission.severity.toLowerCase()}`}>{submission.severity}</span>
          </button>
        ))}
      </div>
      {selectedSubmission && (
        <div className="submission-detail">
          <div className="page-heading">
            <h2>{selectedSubmission.title}</h2>
            <button className="secondary-button" type="button" onClick={() => setSelectedSubmission(null)}>Close</button>
          </div>
          <p>{selectedSubmission.description}</p>
          <div className="program-meta">
            <strong>Researcher</strong><span>{selectedSubmission.researcher}</span>
            <strong>Status</strong><span>{selectedSubmission.status}</span>
            <strong>Submitted</strong><span>{selectedSubmission.submittedAt}</span>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProjectDetails;
