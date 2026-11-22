# VulnFlow

A MERN-stack bug bounty and vulnerability management platform connecting security researchers with organizations.

## Project structure

```text
FE/  React + Vite frontend
     src/components/  Login, Signin, and Home screens
     src/services/    Frontend API services
BE/  Express backend
     src/routes/      Complete API areas: auth, profile, projects, submissions
     src/models/      Mongoose schemas
     src/middleware/  Authentication and upload middleware
     src/config/      MongoDB and local file storage configuration
     uploads/         Uploaded profile images and report evidence (ignored by Git)
```

## Run the demo

Open two terminals from the repository root:

```powershell
cd BE
npm.cmd install
npm.cmd run dev
```

```powershell
cd FE
npm.cmd install
npm.cmd run dev
```

The backend connects to MongoDB before starting. The React page at `http://localhost:5173` fetches its message from the Express API at `http://localhost:5000/api/message`.

## Authentication demo

Email/password signup and Google sign-in use Firebase when configured. The frontend sends a Firebase ID token to `POST /api/auth/firebase`. Express verifies it, finds or creates a MongoDB user by `firebaseUid`, and returns the existing app JWT. Projects, reports, and uploads keep using MongoDB user IDs. Logout clears both sessions.

With Firebase settings empty, the original bcrypt email signup/login works for a local demo. Once Firebase is configured, use a Firebase account for email or Google login. Old MongoDB accounts are not automatically migrated or linked; use a different email for a new Firebase demo account. Existing data is kept.

## Firebase setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. In **Authentication > Sign-in method**, enable **Email/Password** and **Google** (select a support email).
3. Register a **Web app** in **Project settings > General**. Copy these three values into `FE/.env`:

   ```dotenv
   VITE_FIREBASE_API_KEY=your-apiKey
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   ```

4. Add `FIREBASE_PROJECT_ID=your-project-id` to `BE/.env`. Under **Authentication > Settings > Authorized domains**, add `localhost` if missing.
5. Restart both servers. Test email signup/login and **Continue with Google**.

No Firestore, Hosting, Analytics, or service-account key is needed. Token verification requires internet access. If Firebase signup succeeds but saving to MongoDB fails, log in to retry instead of signing up again.

Run `npm.cmd test` in `BE` for the mocked login and upload checks. Live Firebase testing requires your project settings.

References: [email/password](https://firebase.google.com/docs/auth/web/password-auth), [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens).

## AI description assistant

In the vulnerability report form, **Improve with AI** rewrites the bug hunter's draft and separately flags missing details. The user can choose **Use suggestion** or **Cancel**; the draft is never replaced automatically. Editing the source description hides outdated suggestions. Only the description is sent to Groq; files, account details, title, and severity are not sent or modified.

Add `GROQ_API_KEY=your-key` to `BE/.env`, then restart the backend. Optionally set `GROQ_MODEL` (default: `openai/gpt-oss-20b`). No new package or frontend key is needed. Without a key, normal report submission still works and the AI button returns a setup message.

The code is separated into the backend provider service (`BE/src/services/reportAssistant.js`), authenticated route (`POST /api/ai/improve-description`), frontend API helper, and suggestion component. The provider call uses a timeout and validates the JSON response. Its prompt asks the model to preserve facts and flag unknowns; users should review the result because AI can still make mistakes. [Groq API reference](https://console.groq.com/docs/api-reference).

## Profile images

The authenticated `PATCH /api/profile` endpoint accepts a multipart form field named `profileImage`, saves it under `BE/uploads/profile-images/<userId>/`, and stores its public backend URL in MongoDB. Replacing a local profile picture removes the previous image. Images are limited to 5 MB and support JPEG, PNG, WebP, and GIF.

## Security programs

The **My Projects** page supports creating programs for Web Application, API, Cloud, Network, and Source Code security. Mobile testing is intentionally not included yet because file uploads such as APK/IPA are not supported. Each program stores a domain-specific scope, description, and bounty amount. Bug hunters can browse all available projects from **Explore Projects** and open their details.

## Bounty reports

Bug hunters can submit a report from a project detail page with a title, description, severity, reproduction video, and PDF evidence. Files are saved under `BE/uploads/reports/<userId>/`, with relative paths stored in MongoDB. This folder is not publicly served. After checking report access, the backend issues one-hour signed download links that work in a new browser tab. Reload the reports to renew expired links. Clients are identified as project owners and can view, approve, or reject submissions. Submitted reports appear in **My Reports** with their current status and evidence links. Evidence files are limited to 50 MB each. Failed submissions clean up newly saved files.

The upload folders are created automatically, independent of the terminal's working directory. Keep `BE/uploads` when restarting or moving the demo; MongoDB contains file paths, not the files themselves. Existing Supabase files are not automatically copied: re-upload profile images and resubmit evidence to store them locally.

## Environment variables

Local `BE/.env` and `FE/.env` files are ignored by Git. Copy the corresponding `.env.example` files when setting up a new machine, then set `MONGODB_URI` and a strong `JWT_SECRET` in `BE/.env`. `API_URL` is the backend's public address for uploaded images and evidence links (for example, `http://localhost:5000`); if omitted, the request origin is used. Supabase configuration is no longer required. Never commit credentials or paste them into tracked files.
