# VulnFlow

A MERN-stack bug bounty and vulnerability management platform connecting security researchers with organizations.

## Project structure

```text
FE/  React + Vite frontend
BE/  Express backend
```

## Run the demo

Open two terminals from the repository root:

```powershell
cd BE
npm install
npm run dev
```

```powershell
cd FE
npm install
npm run dev
```

The React page at `http://localhost:5173` fetches its message from the Express API at `http://localhost:5000/api/message`.

## Environment variables

Local `BE/.env` and `FE/.env` files are ignored by Git. Copy the corresponding `.env.example` files when setting up a new machine. `BE/.env` already documents the future `MONGODB_URI` setting; MongoDB connection code will be added with the database layer.
