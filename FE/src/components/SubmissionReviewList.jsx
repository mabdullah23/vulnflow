import { useEffect, useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";
import { statusLabels } from "../services/reportStatus.js";
import ReportComments from "./ReportComments.jsx";

const actionLabels = {
  under_review: "Start review",
  accepted: "Accept",
  rejected: "Reject",
  resolved: "Mark resolved",
  closed: "Close report",
};

function SubmissionReviewList({ projectId }) {
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [commentReport, setCommentReport] = useState(null);

  function loadSubmissions() {
    authRequest(`/api/submissions/project/${projectId}`, {
      token: localStorage.getItem(tokenKey),
    })
      .then((data) => setSubmissions(data.submissions))
      .catch((requestError) => setError(requestError.message));
  }

  useEffect(() => {
    loadSubmissions();
  }, [projectId]);

  async function review(id, status) {
    setError("");
    setUpdating(id);
    try {
      const data = await authRequest(`/api/submissions/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        token: localStorage.getItem(tokenKey),
      });
      setSubmissions((items) => items.map((item) => item.id === id ? data.submission : item));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="submission-review">
      <h2>Submitted reports</h2>
      {error && <p className="error">{error}</p>}
      {!error && submissions.length === 0 && <p className="empty-state">No reports submitted yet.</p>}
      <div className="item-list">
        {submissions.map((submission) => (
          <article className="review-item" key={submission.id}>
            <div>
              <h3>{submission.title}</h3>
              <p>{submission.description}</p>
              <small>Bug hunter: {submission.bugHunter?.name || "Unknown"} · <a href={submission.videoUrl} target="_blank" rel="noreferrer">Video</a> · <a href={submission.pdfUrl} target="_blank" rel="noreferrer">PDF</a></small>
            </div>
            <div className="review-actions">
              <button className="secondary-button" type="button" onClick={() => setCommentReport(commentReport === submission.id ? null : submission.id)}>
                {commentReport === submission.id ? "Hide comments" : "Comments"}
              </button>
              <span className={`badge badge-${submission.status}`}>{statusLabels[submission.status]}</span>
              {submission.nextStatuses.map((status) => (
                <button key={status} type="button" disabled={updating !== null}
                  className={status === "rejected" ? "danger-button" : undefined}
                  onClick={() => review(submission.id, status)}>
                  {actionLabels[status]}
                </button>
              ))}
            </div>
            {commentReport === submission.id && <ReportComments key={submission.id} submissionId={submission.id} />}
          </article>
        ))}
      </div>
    </div>
  );
}

export default SubmissionReviewList;
