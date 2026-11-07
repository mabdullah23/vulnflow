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
      localStorage.setItem(tokenKey, data.token);
      onAuthenticated(data.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h1>VulnFlow</h1>
      <p className="subtitle">Create your account</p>
      <form onSubmit={submit}>
        <label>
          Username
          <input name="username" value={form.username} onChange={updateField} required />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={updateField} required />
        </label>
        <label>
          Password
          <input type="password" name="password" value={form.password} onChange={updateField} minLength="8" required />
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
