import mongoose from "mongoose";

const supportedDomains = ["web", "api", "cloud", "network", "source-code"];

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      enum: supportedDomains,
      required: true,
    },
    bountyAmount: {
      type: Number,
      min: 0,
      required: true,
    },
    scope: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export { supportedDomains };
export default mongoose.model("Project", projectSchema);
