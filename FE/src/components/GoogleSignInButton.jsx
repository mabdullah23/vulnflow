import { authErrorMessage, firebaseConfigured, loginWithGoogle } from "../services/firebaseAuth.js";

export default function GoogleSignInButton({ disabled, onPendingChange, onError, onAuthenticated }) {
  async function signIn() {
    onError("");
    onPendingChange(true);
    try {
      onAuthenticated(await loginWithGoogle());
    } catch (error) {
      onError(authErrorMessage(error));
    } finally {
      onPendingChange(false);
    }
  }
  return (
    <div className="google-signin">
      <div className="auth-divider"><span>or</span></div>
      <button className="google-button" type="button" disabled={disabled || !firebaseConfigured} onClick={signIn}>
        <span className="google-mark" aria-hidden="true">G</span> Continue with Google
      </button>
      {!firebaseConfigured && <p className="auth-provider-note">Google sign-in will be available soon.</p>}
    </div>
  );
}
