import { useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";

function Login({ onAuthenticated, onSwitch }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await authRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      sessionStorage.setItem(tokenKey, data.token);
      onAuthenticated(data.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card">
      <div className="auth-brand"><span className="brand-mark" aria-hidden="true">[v]</span> VulnFlow</div>
      <p className="page-path">~/ login</p>
      <h1>Welcome back.</h1>
      <p className="subtitle">Log in to your workspace.</p>
      <form onSubmit={submit}>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" value={form.email} onChange={updateField} required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" value={form.password} onChange={updateField} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : "Log in"}
        </button>
      </form>
      <p className="switch">
        Need an account?{" "}
        <button className="link-button" type="button" onClick={onSwitch}>Sign up</button>
      </p>
    </section>
  );
}

export default Login;
