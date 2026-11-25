import { useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";

const domains = [
  { value: "web", label: "Web Application", prompt: "Website URL" },
  { value: "api", label: "API Security", prompt: "API documentation or base URL" },
  { value: "cloud", label: "Cloud Security", prompt: "Cloud configuration details" },
  { value: "network", label: "Network Security", prompt: "Authorized IP ranges and testing boundaries" },
  { value: "source-code", label: "Source Code Security", prompt: "Source code repository URL" },
];

function CreateProject({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    domain: "web",
    bountyAmount: "",
    scope: "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const selectedDomain = domains.find((domain) => domain.value === form.domain);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const data = await authRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(form),
        token: sessionStorage.getItem(tokenKey),
      });
      onCreated(data.project);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page-card">
      <p className="page-path">~/ projects / new</p>
      <div className="page-heading">
        <div>
          <h1>Create Security Program</h1>
          <p>Define the task researchers can work on.</p>
        </div>
        <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
      </div>
      <form className="project-form" onSubmit={submit}>
        <label>
          Program name
          <input name="name" value={form.name} onChange={updateField} required />
        </label>
        <label>
          Task description
          <textarea name="description" value={form.description} onChange={updateField} rows="5" required />
        </label>
        <label>
          Security testing domain
          <select name="domain" value={form.domain} onChange={updateField}>
            {domains.map((domain) => (
              <option value={domain.value} key={domain.value}>{domain.label}</option>
            ))}
          </select>
        </label>
        <div className="form-note">
          <strong>Selected program: </strong>{selectedDomain.label}
          <span>{selectedDomain.prompt} is required for this domain.</span>
        </div>
        <label>
          {selectedDomain.prompt}
          <input name="scope" value={form.scope} onChange={updateField} required />
        </label>
        <label>
          Bounty price
          <input type="number" name="bountyAmount" value={form.bountyAmount} onChange={updateField} min="0" step="1" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Creating..." : "Create program"}
        </button>
      </form>
    </section>
  );
}

export default CreateProject;
