import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    bugHunter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    videoUrl: {
      type: String,
      default: "",
    },
    videoPath: {
      type: String,
      default: "",
    },
    pdfUrl: {
      type: String,
      default: "",
    },
    pdfPath: {
      type: String,
      default: "",
    },
    bountyAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    reviewNote: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

submissionSchema.index({ project: 1, bugHunter: 1, title: 1 });

export default mongoose.model("Submission", submissionSchema);
