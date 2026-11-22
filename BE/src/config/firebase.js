import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let auth;

export function getFirebaseAuth() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw Object.assign(new Error("Set FIREBASE_PROJECT_ID in BE/.env."), { status: 503 });
  }
  // Verifying ID tokens needs only the project ID and Google's public keys.
  auth ||= getAuth(initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID }));
  return auth;
}
