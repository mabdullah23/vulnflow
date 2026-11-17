import multer from "multer";

const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
const allowedPdfTypes = ["application/pdf"];

export const reportEvidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 2,
  },
  fileFilter: (_request, file, callback) => {
    const allowedTypes =
      file.fieldname === "video" ? allowedVideoTypes : allowedPdfTypes;

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error(
          file.fieldname === "video"
            ? "Video must be MP4, WebM, or QuickTime."
            : "Evidence must be a PDF.",
        ),
      );
    }

    return callback(null, true);
  },
});
