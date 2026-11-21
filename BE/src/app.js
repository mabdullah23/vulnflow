import cors from "cors";
import express from "express";
import multer from "multer";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import profileRoutes from "./routes/profile.js";
import submissionRoutes from "./routes/submissions.js";
import { uploadsRoot } from "./config/storage.js";
import path from "node:path";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);
app.use(express.json());
app.use("/uploads/profile-images", express.static(path.join(uploadsRoot, "profile-images"), {
  dotfiles: "deny",
  setHeaders: (response) => response.setHeader("X-Content-Type-Options", "nosniff"),
}));
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/submissions", submissionRoutes);

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/message", (_request, response) => {
  response.json({
    message: "Hello from the VulnFlow Express server!",
  });
});

app.use((error, _request, response, next) => {
  if (
    error instanceof multer.MulterError ||
    error?.message?.includes("images are allowed") ||
    error?.message?.includes("Video must") ||
    error?.message?.includes("Evidence must")
  ) {
    return response.status(400).json({
      message: error.code === "LIMIT_FILE_SIZE"
        ? error.field === "profileImage"
          ? "Profile images must be 5 MB or smaller."
          : "Each evidence file must be 50 MB or smaller."
        : error.message,
    });
  }
  return next(error);
});

export default app;
