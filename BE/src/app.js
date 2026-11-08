import cors from "cors";
import express from "express";
import multer from "multer";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/message", (_request, response) => {
  response.json({
    message: "Hello from the VulnFlow Express server!",
  });
});

app.use((error, _request, response, next) => {
  if (error instanceof multer.MulterError || error?.message?.includes("images are allowed")) {
    return response.status(400).json({ message: error.message });
  }
  return next(error);
});

export default app;
