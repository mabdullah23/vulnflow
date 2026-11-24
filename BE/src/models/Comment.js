import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  submission: { type: mongoose.Schema.Types.ObjectId, ref: "Submission", required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String, required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });

export default mongoose.model("Comment", commentSchema);
