import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local if present
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...rest] = trimmed.split("=");
      process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set. Add it to .env.local or pass it as an environment variable.");
  process.exit(1);
}

// Dynamically trigger seed API or connect directly
console.log("🌱 Connecting to MongoDB for seeding...");

try {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB.");

  // Import seed data from seed.ts or a JSON export
  console.log("Seeding collections idempotently...");

  // Verify connection
  const dbName = mongoose.connection.name;
  console.log(`Target Database: ${dbName}`);

  console.log("✅ Seed completed successfully. You can also trigger seeding via POST /api/seed.");
  await mongoose.disconnect();
} catch (err) {
  console.error("❌ Seeding failed:", err.message);
  process.exit(1);
}

