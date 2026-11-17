import { useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";

function ReportSubmissionForm({ projectId, onSubmitted }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "medium",
  });
  const [video, setVideo] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    body.append("video", video);
    body.append("pdf", pdf);

    try {
      await authRequest(`/api/submissions/project/${projectId}`, {
        method: "POST",
        body,
        token: localStorage.getItem(tokenKey),
      });
      onSubmitted();
      setForm({ title: "", description: "", severity: "medium" });
      setVideo(null);
      setPdf(null);
      event.target.reset();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="submission-form-panel">
      <h2>Submit vulnerability report</h2>
      <p className="muted">Include a reproduction video and a PDF report.</p>
      <form className="project-form" onSubmit={submit}>
        <label>
          Report title
          <input name="title" value={form.title} onChange={updateField} required />
        </label>
        <label>
          Vulnerability details
          <textarea name="description" value={form.description} onChange={updateField} rows="5" required />
        </label>
        <label>
          Severity
          <select name="severity" value={form.severity} onChange={updateField}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label>
          Reproduction video
          <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setVideo(event.target.files?.[0] || null)} required />
        </label>
        <label>
          PDF evidence
          <input type="file" accept="application/pdf" onChange={(event) => setPdf(event.target.files?.[0] || null)} required />
        </label>
        <small>Maximum size: 50 MB per file. No other attachments are supported.</small>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isSubmitting || !video || !pdf}>
          {isSubmitting ? "Submitting..." : "Submit report"}
        </button>
      </form>
    </div>
  );
}

export default ReportSubmissionForm;
