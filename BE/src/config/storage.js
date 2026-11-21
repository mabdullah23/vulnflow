import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const uploadsRoot = fileURLToPath(new URL("../../uploads/", import.meta.url));

const extensions = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/gif": "gif", "video/mp4": "mp4", "video/webm": "webm",
  "video/quicktime": "mov", "application/pdf": "pdf",
};

export async function storeFile(folder, file, ownerId) {
  const extension = extensions[file.mimetype];
  if (!extension) throw new Error("Unsupported file type.");
  const relativePath = `${folder}/${ownerId}/${randomUUID()}.${extension}`;
  const absolutePath = path.join(uploadsRoot, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, file.buffer, { flag: "wx" });
  return relativePath;
}

export async function removeFile(relativePath) {
  if (!relativePath) return;
  await unlink(path.join(uploadsRoot, relativePath)).catch((error) => {
    if (error.code !== "ENOENT") console.error("Upload cleanup failed:", error.message);
  });
}

export function serverUrl(request) {
  return process.env.API_URL?.replace(/\/$/, "") || `${request.protocol}://${request.get("host")}`;
}
