import mongoose from "mongoose";

export async function connectToDatabase() {
  const { MONGODB_URI: mongoDbUri } = process.env;

  if (!mongoDbUri) {
    throw new Error("MONGODB_URI is not configured in BE/.env.");
  }

  await mongoose.connect(mongoDbUri);
  console.log("Connected to MongoDB");
}
