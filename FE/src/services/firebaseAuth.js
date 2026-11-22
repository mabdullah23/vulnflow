import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword, getAuth, GoogleAuthProvider,
  signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile,
} from "firebase/auth";
import { authRequest, tokenKey } from "./authApi.js";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};
export const firebaseConfigured = Object.values(config).every(Boolean);
const auth = firebaseConfigured ? getAuth(initializeApp(config)) : null;

async function saveSession(path, body) {
  const data = await authRequest(path, { method: "POST", body: JSON.stringify(body) });
  localStorage.setItem(tokenKey, data.token);
  return data.user;
}

async function firebaseSession(user, username) {
  try {
    return await saveSession("/api/auth/firebase", { idToken: await user.getIdToken(), username });
  } catch (error) {
    await signOut(auth);
    throw error;
  }
}

export async function loginWithEmail(form) {
  if (!auth) return saveSession("/api/auth/login", form);
  const { user } = await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
  return firebaseSession(user);
}

export async function signupWithEmail(form) {
  if (!auth) return saveSession("/api/auth/signup", form);
  const { user } = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
  await updateProfile(user, { displayName: form.username.trim() });
  return firebaseSession(user, form.username.trim());
}

export async function loginWithGoogle() {
  const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
  return firebaseSession(user);
}

export async function logoutFirebase() {
  if (auth) await signOut(auth);
}

export function authErrorMessage(error) {
  const messages = {
    "auth/invalid-credential": "Invalid email or password.",
    "auth/email-already-in-use": "Email already registered. Please log in.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  };
  return messages[error.code] || error.message || "Could not sign in. Please try again.";
}
