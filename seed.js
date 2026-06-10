#!/usr/bin/env node
// Seeds MongoDB with TreeView reference data and migrates disk uploads.

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { connectDB, mongoose } = require("./db");
const Dorm = require("./models/Dorm");
const Tour = require("./models/Tour");
const Landmark = require("./models/Landmark");
const QuizQuestion = require("./models/QuizQuestion");
const RoomUpload = require("./models/RoomUpload");
const Review = require("./models/Review");
const {
  buildDorms,
  buildTourConfigs,
  buildReviews,
  LANDMARKS,
  QUIZ_QUESTIONS,
} = require("./data/seedData");

const UPLOADS_DIR = path.join(__dirname, "uploads");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function seedReferenceData() {
  const dorms = buildDorms();
  await Dorm.deleteMany({});
  await Dorm.insertMany(dorms);
  console.log(`Seeded ${dorms.length} dorms`);

  const tours = buildTourConfigs();
  await Tour.deleteMany({});
  await Tour.insertMany(tours);
  console.log(`Seeded ${tours.length} tours`);

  await Landmark.deleteMany({});
  await Landmark.insertMany(LANDMARKS);
  console.log(`Seeded ${LANDMARKS.length} landmarks`);

  await QuizQuestion.deleteMany({});
  await QuizQuestion.insertMany(QUIZ_QUESTIONS);
  console.log(`Seeded ${QUIZ_QUESTIONS.length} quiz questions`);

  // Only clear curated quotes — never touch user-submitted reviews.
  const reviews = buildReviews();
  await Review.deleteMany({ curated: true });
  await Review.insertMany(reviews);
  console.log(`Seeded ${reviews.length} curated reviews`);
}

async function migrateDiskUploads() {
  if (!fs.existsSync(UPLOADS_DIR)) return;

  const dirs = fs.readdirSync(UPLOADS_DIR).filter((name) => UUID_RE.test(name));
  let migrated = 0;

  for (const uploadId of dirs) {
    const metaPath = path.join(UPLOADS_DIR, uploadId, "metadata.json");
    if (!fs.existsSync(metaPath)) continue;

    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    } catch {
      continue;
    }

    await RoomUpload.findOneAndUpdate(
      { uploadId },
      {
        uploadId,
        kind: meta.kind || "sixPhoto",
        dormId: meta.dormId,
        roomType: meta.roomType,
        roomName: meta.roomName || "",
        userEmail: meta.userEmail || "",
        originalNames: meta.originalNames || [],
        savedFiles: meta.savedFiles || [],
        fileSizes: meta.fileSizes || [],
        createdAt: meta.timestamp ? new Date(meta.timestamp) : new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    migrated++;
  }

  if (migrated) console.log(`Migrated ${migrated} disk uploads to MongoDB`);
}

async function main() {
  await connectDB();
  await seedReferenceData();
  await migrateDiskUploads();
  await mongoose.disconnect();
  console.log("Seed complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
