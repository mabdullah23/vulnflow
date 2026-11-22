import { useState } from "react";
import { authErrorMessage, signupWithEmail } from "../services/firebaseAuth.js";
import GoogleSignInButton from "./GoogleSignInButton.jsx";

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
      onAuthenticated(await signupWithEmail(form));
    } catch (requestError) {
      setError(authErrorMessage(requestError));
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
      <GoogleSignInButton disabled={isSubmitting} onPendingChange={setIsSubmitting} onError={setError} onAuthenticated={onAuthenticated} />
      <p className="switch">
        Already have an account?{" "}
        <button className="link-button" type="button" disabled={isSubmitting} onClick={onSwitch}>Log in</button>
      </p>
    </section>
  );
}

export default Signin;
