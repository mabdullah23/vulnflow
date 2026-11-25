import { useState } from "react";
import { authRequest, tokenKey } from "../services/authApi.js";

function Signin({ onAuthenticated, onSwitch }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
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
      const data = await authRequest("/api/auth/signup", {
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
      <p className="page-path">~/ signup</p>
      <h1>Create your account.</h1>
      <p className="subtitle">Your research starts here.</p>
      <form onSubmit={submit}>
        <label>
          Username
          <input name="username" autoComplete="username" value={form.username} onChange={updateField} required />
        </label>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" value={form.email} onChange={updateField} required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="new-password" value={form.password} onChange={updateField} minLength="8" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : "Sign up"}
        </button>
      </form>
      <p className="switch">
        Already have an account?{" "}
        <button className="link-button" type="button" onClick={onSwitch}>Log in</button>
      </p>
    </section>
  );
}

export default Signin;
