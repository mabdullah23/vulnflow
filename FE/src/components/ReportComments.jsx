import { useEffect, useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";

function ReportComments({ submissionId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const path = `/api/submissions/${submissionId}/comments`;

  async function loadComments() {
    setLoading(true);
    setError("");
    try {
      const data = await authRequest(path, { token: sessionStorage.getItem(tokenKey) });
      setComments(data.comments);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadComments(); }, [submissionId]);

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      await authRequest(path, {
        method: "POST", body: JSON.stringify({ text }), token: sessionStorage.getItem(tokenKey),
      });
      setText("");
      await loadComments();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="report-comments" aria-label="Report comments">
      <h3>Comments</h3>
      <button className="secondary-button" type="button" disabled={loading || sending} onClick={loadComments}>Refresh comments</button>
      {loading && <p>Loading comments...</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && comments.length === 0 && <p>No comments yet.</p>}
      {comments.map((comment) => (
        <article className="report-comment" key={comment._id}>
          <strong>{comment.authorName}</strong>{" "}
          <small>{new Date(comment.createdAt).toLocaleString()}</small>
          <p>{comment.text}</p>
        </article>
      ))}
      <form onSubmit={submit}>
        <label>
          Add a comment
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows="3" maxLength="2000" disabled={sending} required />
        </label>
        <button type="submit" disabled={sending || loading || !text.trim()}>{sending ? "Sending..." : "Send comment"}</button>
      </form>
    </section>
  );
}

export default ReportComments;
