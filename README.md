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

if not working
node --input-type=module -e "import dns from 'node:dns'; dns.setServers(['1.1.1.1','8.8.8.8']); await import('./src/server.js');"
```

```powershell
cd FE
npm.cmd install
npm.cmd run dev
```

The backend connects to MongoDB before starting. The React page at `http://localhost:5173` fetches its message from the Express API at `http://localhost:5000/api/message`.

## Authentication

Email/password signup and login use the Express API and MongoDB. Signup stores a bcrypt password hash in the user document. Login verifies that hash and returns an app JWT. The browser stores only the JWT in per-tab sessionStorage (`vulnflow_token`); passwords are not saved in browser storage. Separate tabs can log into different accounts without replacing each other's token. Reloading preserves that tab's login; closing the tab ends its session. Logout affects only the current tab. The old shared localStorage token is removed on startup; sign in again after updating.

Accounts created with the original email/password login continue to work with their existing MongoDB user IDs, projects, and reports. Accounts created exclusively through the removed external provider have no local password hash and cannot use password login until a password is securely established. No database records are deleted by this change.

Set `MONGODB_URI` and `JWT_SECRET` in `BE/.env`.

## AI description assistant

In the vulnerability report form, **Improve with AI** rewrites the bug hunter's draft and separately flags missing details. The user can choose **Use suggestion** or **Cancel**; the draft is never replaced automatically. Editing the source description hides outdated suggestions. Only the description is sent to Groq; files, account details, title, and severity are not sent or modified.

Add `GROQ_API_KEY=your-key` to `BE/.env`, then restart the backend. Optionally set `GROQ_MODEL` (default: `openai/gpt-oss-20b`). No new package or frontend key is needed. Without a key, normal report submission still works and the AI button returns a setup message.

The code is separated into the backend provider service (`BE/src/services/reportAssistant.js`), authenticated route (`POST /api/ai/improve-description`), frontend API helper, and suggestion component. The provider call uses a timeout and validates the JSON response. Its prompt asks the model to preserve facts and flag unknowns; users should review the result because AI can still make mistakes. [Groq API reference](https://console.groq.com/docs/api-reference).

## Profile images

The authenticated `PATCH /api/profile` endpoint accepts a multipart form field named `profileImage`, saves it under `BE/uploads/profile-images/<userId>/`, and stores its public backend URL in MongoDB. Replacing a local profile picture removes the previous image. Images are limited to 5 MB and support JPEG, PNG, WebP, and GIF.

## Security programs

The **My Projects** page supports creating programs for Web Application, API, Cloud, Network, and Source Code security. Mobile testing is intentionally not included yet because file uploads such as APK/IPA are not supported. Each program stores a domain-specific scope, description, and bounty amount. Bug hunters can browse all available projects from **Explore Projects** and open their details.

Owners can open a program and choose **Edit program** to change its description, scope, and bounty. **Save changes** updates the program; **Cancel** discards the edits. The API checks ownership and requires non-empty description/scope and a non-negative bounty. Bounty changes apply to new reports; existing reports keep their recorded bounty amount.

## Bounty reports

Bug hunters can submit a report from a project detail page with a title, description, severity, reproduction video, and PDF evidence. Files are saved under `BE/uploads/reports/<userId>/`, with relative paths stored in MongoDB. This folder is not publicly served. After checking report access, the backend issues one-hour signed download links that work in a new browser tab. Reload the reports to renew expired links. Clients are identified as project owners and can move reports through Submitted -> Under Review -> Accepted -> Resolved -> Closed. Under Review reports can instead be Rejected, then Closed. Only the next allowed steps appear as buttons; the API rejects skipped or backward steps. Older pending/approved reports are shown as Submitted/Accepted and updated to the new status on their next transition. Submitted reports appear in **My Reports** with their current status and evidence links. Evidence files are limited to 50 MB each. Failed submissions clean up newly saved files.

The upload folders are created automatically, independent of the terminal's working directory. Keep `BE/uploads` when restarting or moving the demo; MongoDB contains file paths, not the files themselves. Existing Supabase files are not automatically copied: re-upload profile images and resubmit evidence to store them locally.

## Search, filters, and sorting

**My Projects** and **Explore Projects** support searching program names, descriptions, and scope, filtering by domain, and sorting by date, name, or bounty. **My Reports** and program review lists support searching report titles/descriptions, program names, and researcher names where available, filtering by status and severity, and sorting by date, title, or severity. Controls work together and **Clear** restores the default newest-first list. Filtering runs in the browser over the complete lists returned by the existing APIs.

## Comments and notifications

Researchers can open a report in **My Reports** to read and add comments. Program owners use **Comments** beside a report in the program review list. Threads are private to that report's researcher and program owner, show oldest comments first, and have a **Refresh comments** button. Comments are plain text with a 2,000-character limit.

The navbar bell shows unread notifications and the latest 30 items. New reports notify the program owner, replies notify the other participant, and status changes notify the researcher. Notifications refresh every 30 seconds and when the bell is opened. **Mark all as read** affects only the current user's notifications. Comments and notifications are stored in MongoDB; no extra service or setup is required. If saving a notification fails, the report or comment remains saved and the backend logs the notification error.

## Environment variables

Local `BE/.env` and `FE/.env` files are ignored by Git. Copy the corresponding `.env.example` files when setting up a new machine, then set `MONGODB_URI` and a strong `JWT_SECRET` in `BE/.env`. `API_URL` is the backend's public address for uploaded images and evidence links (for example, `http://localhost:5000`); if omitted, the request origin is used. Supabase configuration is no longer required. Never commit credentials or paste them into tracked files.