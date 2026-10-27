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

const seedDataPath = path.resolve(__dirname, "seed-data.json");
if (!fs.existsSync(seedDataPath)) {
  console.error("❌ seed-data.json not found in scripts directory.");
  process.exit(1);
}

const seedData = JSON.parse(fs.readFileSync(seedDataPath, "utf-8"));

console.log("🌱 Connecting to MongoDB for seeding...");

try {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB.");

  const db = mongoose.connection.db;
  console.log(`Target Database: ${mongoose.connection.name}`);

  const collections = [
    { name: "patients", items: seedData.PATIENTS },
    { name: "visits", items: seedData.VISITS },
    { name: "followups", items: seedData.FOLLOWUPS },
    { name: "emergencies", items: seedData.EMERGENCIES },
    { name: "referrals", items: seedData.REFERRALS },
    { name: "laborders", items: seedData.LABS },
    { name: "stockoutreports", items: seedData.STOCKOUTS },
    { name: "earnings", items: seedData.EARNINGS },
    { name: "appointments", items: seedData.APPOINTMENTS },
    { name: "sms", items: seedData.SMS },
    { name: "calllogs", items: seedData.CALLS },
    { name: "phcs", items: seedData.PHCS },
    { name: "doctors", items: seedData.DOCTORS },
    { name: "ashas", items: [seedData.ASHA] },
  ];

  console.log("Seeding collections idempotently...");

  for (const col of collections) {
    if (!col.items || !col.items.length) continue;
    const collection = db.collection(col.name);
    for (const item of col.items) {
      await collection.updateOne(
        { id: item.id },
        { $set: item },
        { upsert: true }
      );
    }
    const count = await collection.countDocuments();
    console.log(`  ✓ ${col.name}: ${count} documents`);
  }

  console.log("✅ Seed completed successfully. Database is ready.");
  await mongoose.disconnect();
} catch (err) {
  console.error("❌ Seeding failed:", err.message);
  process.exit(1);
}
