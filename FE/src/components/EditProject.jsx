import { useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";

function EditProject({ project, onSaved, onCancel }) {
  const [form, setForm] = useState({
    description: project.description,
    scope: project.scope,
    bountyAmount: project.bountyAmount,
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const data = await authRequest(`/api/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
        token: localStorage.getItem(tokenKey),
      });
      onSaved(data.project);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page-card">
      <h1>Edit {project.name}</h1>
      <form className="project-form" onSubmit={submit}>
        <label>
          Task description
          <textarea name="description" value={form.description} onChange={updateField} rows="5" required />
        </label>
        <label>
          Scope
          <textarea name="scope" value={form.scope} onChange={updateField} rows="3" required />
        </label>
        <label>
          Bounty price
          <input type="number" name="bountyAmount" value={form.bountyAmount} onChange={updateField} min="0" step="any" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</button>
        <button className="secondary-button" type="button" disabled={isSaving} onClick={onCancel}>Cancel</button>
      </form>
    </section>
  );
}

export default EditProject;
