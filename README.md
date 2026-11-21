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

- `POST /api/auth/signup` accepts `username`, `email`, and `password`.
- `POST /api/auth/login` accepts `email` and `password`.
- `GET /api/auth/me` requires an `Authorization: Bearer <token>` header.

Passwords are hashed with bcrypt. The frontend stores the JWT locally for this demo and removes it when the user logs out.

## Profile images

The authenticated `PATCH /api/profile` endpoint accepts a multipart form field named `profileImage`, saves it under `BE/uploads/profile-images/<userId>/`, and stores its public backend URL in MongoDB. Replacing a local profile picture removes the previous image. Images are limited to 5 MB and support JPEG, PNG, WebP, and GIF.

## Security programs

The **My Projects** page supports creating programs for Web Application, API, Cloud, Network, and Source Code security. Mobile testing is intentionally not included yet because file uploads such as APK/IPA are not supported. Each program stores a domain-specific scope, description, and bounty amount. Bug hunters can browse all available projects from **Explore Projects** and open their details.

## Bounty reports

Bug hunters can submit a report from a project detail page with a title, description, severity, reproduction video, and PDF evidence. Files are saved under `BE/uploads/reports/<userId>/`, with relative paths stored in MongoDB. This folder is not publicly served. After checking report access, the backend issues one-hour signed download links that work in a new browser tab. Reload the reports to renew expired links. Clients are identified as project owners and can view, approve, or reject submissions. Submitted reports appear in **My Reports** with their current status and evidence links. Evidence files are limited to 50 MB each. Failed submissions clean up newly saved files.

The upload folders are created automatically, independent of the terminal's working directory. Keep `BE/uploads` when restarting or moving the demo; MongoDB contains file paths, not the files themselves. Existing Supabase files are not automatically copied: re-upload profile images and resubmit evidence to store them locally.

## Environment variables

Local `BE/.env` and `FE/.env` files are ignored by Git. Copy the corresponding `.env.example` files when setting up a new machine, then set `MONGODB_URI` and a strong `JWT_SECRET` in `BE/.env`. `API_URL` is the backend's public address for uploaded images and evidence links (for example, `http://localhost:5000`); if omitted, the request origin is used. Supabase configuration is no longer required. Never commit credentials or paste them into tracked files.
