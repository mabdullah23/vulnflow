import { useEffect, useState } from "react";
import ReportSubmissionForm from "./ReportSubmissionForm.jsx";
import SubmissionReviewList from "./SubmissionReviewList.jsx";
import EditProject from "./EditProject.jsx";
import { authRequest, tokenKey } from "../services/authApi.js";

function ProjectDetails({ projectId, onBack }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

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

  const { project, permissions } = details;

  if (editing && permissions.canEdit) {
    return <EditProject project={project} onCancel={() => setEditing(false)} onSaved={(updated) => {
      setDetails({ ...details, project: updated });
      setEditing(false);
    }} />;
  }

  return (
    <section className="page-card">
      <p className="page-path">~/ projects / details</p>
      <button className="back-button" type="button" onClick={onBack}>Back to projects</button>
      {permissions.canEdit && <button className="secondary-button" type="button" onClick={() => setEditing(true)}>Edit program</button>}
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
        {permissions.canSubmit
          ? "Submit a report below when you find a vulnerability."
          : "Review reports submitted by bug hunters below."}
      </div>
      {permissions.canSubmit && (
        <ReportSubmissionForm projectId={projectId} onSubmitted={onBack} />
      )}
      {permissions.canReview && <SubmissionReviewList projectId={projectId} />}
    </section>
  );
}

export default ProjectDetails;
