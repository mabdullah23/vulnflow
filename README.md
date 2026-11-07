# VulnFlow

A MERN-stack bug bounty and vulnerability management platform connecting security researchers with organizations.

## Project structure

```text
FE/  React + Vite frontend
     src/components/  Login, Signin, and Home screens
     src/services/    Frontend API services
BE/  Express backend
     src/controllers/ Authentication request handlers
     src/routes/      API route definitions
     src/models/      Mongoose schemas
     src/middleware/  Authentication middleware
     src/utils/       Shared backend helpers
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

## Environment variables

Local `BE/.env` and `FE/.env` files are ignored by Git. Copy the corresponding `.env.example` files when setting up a new machine, then set `MONGODB_URI` in `BE/.env`. Never commit credentials or paste them into tracked files.
