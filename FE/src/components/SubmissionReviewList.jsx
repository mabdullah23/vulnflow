import { useEffect, useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";

function SubmissionReviewList({ projectId }) {
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState("");

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
    try {
      await authRequest(`/api/submissions/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        token: localStorage.getItem(tokenKey),
      });
      loadSubmissions();
    } catch (requestError) {
      setError(requestError.message);
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
              <span className={`badge badge-${submission.status}`}>{submission.status}</span>
              {submission.status === "pending" && (
                <>
                  <button type="button" onClick={() => review(submission.id, "approved")}>Approve</button>
                  <button className="danger-button" type="button" onClick={() => review(submission.id, "rejected")}>Reject</button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default SubmissionReviewList;
