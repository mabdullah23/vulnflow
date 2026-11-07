import "dotenv/config";
import app from "./app.js";
import { connectToDatabase } from "./config/db.js";

const port = Number(process.env.PORT) || 5000;

try {
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`VulnFlow API running at http://localhost:${port}`);
  });
} catch (error) {
  console.error("Unable to start the server:", error.message);
  process.exit(1);
}
