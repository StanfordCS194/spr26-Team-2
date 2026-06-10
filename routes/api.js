const express = require("express");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const Dorm = require("../models/Dorm");
const Tour = require("../models/Tour");
const Landmark = require("../models/Landmark");
const QuizQuestion = require("../models/QuizQuestion");
const RoomUpload = require("../models/RoomUpload");
const UserProfile = require("../models/UserProfile");
const RoomDesign = require("../models/RoomDesign");
const DormDesign = require("../models/DormDesign");
const {
  ROOM_LABELS,
  REASON_LABELS,
  RANKINGS_SORT_OPTIONS,
  RANKINGS_FILTERS,
  MAIN_QUAD,
  WALK_SPEED_KMH,
  DETOUR_FACTOR,
} = require("../data/seedData");

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VISITOR_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function isValidUploadId(id) {
  return typeof id === "string" && UUID_RE.test(id);
}

function isValidVisitorId(id) {
  return typeof id === "string" && VISITOR_RE.test(id);
}

function notesToObject(notes) {
  if (!notes) return {};
  if (notes instanceof Map) return Object.fromEntries(notes);
  return notes;
}

async function getUploadRecord(uploadId) {
  let record = await RoomUpload.findOne({ uploadId }).lean();
  if (record) return record;

  const metaPath = path.join(UPLOADS_DIR, uploadId, "metadata.json");
  if (!fs.existsSync(metaPath)) return null;

  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    record = await RoomUpload.create({
      uploadId: meta.uploadId,
      kind: meta.kind || "sixPhoto",
      dormId: meta.dormId,
      roomType: meta.roomType,
      roomName: meta.roomName || "",
      userEmail: meta.userEmail || "",
      originalNames: meta.originalNames || [],
      savedFiles: meta.savedFiles || [],
      fileSizes: meta.fileSizes || [],
    });
    return record.toObject();
  } catch {
    return null;
  }
}

// === GET /api/bootstrap ===
router.get("/bootstrap", async (_req, res) => {
  const [dorms, landmarks, quizQuestions] = await Promise.all([
    Dorm.find().sort({ name: 1 }).lean(),
    Landmark.find().sort({ sortOrder: 1 }).lean(),
    QuizQuestion.find().sort({ order: 1 }).lean(),
  ]);

  if (!dorms.length) {
    return res.status(503).json({
      success: false,
      error: "Database not seeded. Run: npm run seed",
    });
  }

  res.json({
    success: true,
    dorms,
    landmarks,
    quizQuestions,
    roomLabels: ROOM_LABELS,
    reasonLabels: REASON_LABELS,
    rankingsSortOptions: RANKINGS_SORT_OPTIONS,
    rankingsFilters: RANKINGS_FILTERS,
    mainQuad: MAIN_QUAD,
    walkSpeedKmh: WALK_SPEED_KMH,
    detourFactor: DETOUR_FACTOR,
  });
});

// === GET /api/dorms ===
router.get("/dorms", async (_req, res) => {
  const dorms = await Dorm.find().sort({ name: 1 }).lean();
  res.json({ success: true, dorms });
});

// === GET /api/dorms/:dormId/tour ===
router.get("/dorms/:dormId/tour", async (req, res) => {
  const tour = await Tour.findOne({ dormId: req.params.dormId }).lean();
  if (!tour) {
    return res.status(404).json({ success: false, error: "Tour not found" });
  }
  res.json({ success: true, dormId: tour.dormId, config: tour.config });
});

// === GET /api/profile/:visitorId ===
router.get("/profile/:visitorId", async (req, res) => {
  if (!isValidVisitorId(req.params.visitorId)) {
    return res.status(400).json({ success: false, error: "Invalid visitor ID" });
  }

  let profile = await UserProfile.findOne({ visitorId: req.params.visitorId }).lean();
  if (!profile) {
    profile = await UserProfile.create({ visitorId: req.params.visitorId });
    profile = profile.toObject();
  }

  res.json({
    success: true,
    visitorId: profile.visitorId,
    shortlist: profile.shortlist || [],
    notes: notesToObject(profile.notes),
    theme: profile.theme || "system",
    lastDormId: profile.lastDormId || "",
    lastRoomType: profile.lastRoomType || "",
  });
});

// === PUT /api/profile/:visitorId ===
router.put("/profile/:visitorId", async (req, res) => {
  if (!isValidVisitorId(req.params.visitorId)) {
    return res.status(400).json({ success: false, error: "Invalid visitor ID" });
  }

  const update = {};
  if (Array.isArray(req.body.shortlist)) {
    const validIds = await Dorm.find({ id: { $in: req.body.shortlist } }).distinct("id");
    update.shortlist = req.body.shortlist.filter((id) => validIds.includes(id));
  }
  if (req.body.theme && ["light", "dark", "system"].includes(req.body.theme)) {
    update.theme = req.body.theme;
  }
  if (typeof req.body.lastDormId === "string") update.lastDormId = req.body.lastDormId.slice(0, 64);
  if (typeof req.body.lastRoomType === "string") update.lastRoomType = req.body.lastRoomType.slice(0, 64);

  if (req.body.notes && typeof req.body.notes === "object") {
    const notesMap = new Map();
    for (const [dormId, text] of Object.entries(req.body.notes)) {
      if (typeof text === "string" && dormId.length <= 64) {
        notesMap.set(dormId, text.slice(0, 5000));
      }
    }
    update.notes = notesMap;
  }

  const profile = await UserProfile.findOneAndUpdate(
    { visitorId: req.params.visitorId },
    { $set: update },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  ).lean();

  res.json({
    success: true,
    visitorId: profile.visitorId,
    shortlist: profile.shortlist || [],
    notes: notesToObject(profile.notes),
    theme: profile.theme || "system",
    lastDormId: profile.lastDormId || "",
    lastRoomType: profile.lastRoomType || "",
  });
});

// === GET /api/uploads/:uploadId/design ===
router.get("/uploads/:uploadId/design", async (req, res) => {
  if (!isValidUploadId(req.params.uploadId)) {
    return res.status(400).json({ success: false, error: "Invalid upload ID" });
  }

  const upload = await getUploadRecord(req.params.uploadId);
  if (!upload) {
    return res.status(404).json({ success: false, error: "Upload not found" });
  }

  const design = await RoomDesign.findOne({ uploadId: req.params.uploadId }).lean();
  if (!design) {
    return res.json({ success: true, design: null });
  }

  res.json({
    success: true,
    design: {
      cameraHeight: design.cameraHeight,
      floorVerts: design.floorVerts,
      items: design.items,
    },
  });
});

// === PUT /api/uploads/:uploadId/design ===
router.put("/uploads/:uploadId/design", async (req, res) => {
  if (!isValidUploadId(req.params.uploadId)) {
    return res.status(400).json({ success: false, error: "Invalid upload ID" });
  }

  const upload = await getUploadRecord(req.params.uploadId);
  if (!upload) {
    return res.status(404).json({ success: false, error: "Upload not found" });
  }

  const cameraHeight = Number(req.body.cameraHeight);
  const floorVerts = Array.isArray(req.body.floorVerts) ? req.body.floorVerts : [];
  const items = Array.isArray(req.body.items) ? req.body.items : [];

  const design = await RoomDesign.findOneAndUpdate(
    { uploadId: req.params.uploadId },
    {
      cameraHeight: Number.isFinite(cameraHeight) ? cameraHeight : 1.4,
      floorVerts,
      items: items.map((it) => ({
        id: String(it.id || "").slice(0, 64),
        x: Number(it.x) || 0,
        z: Number(it.z) || 0,
        rotY: Number(it.rotY) || 0,
      })),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  ).lean();

  res.json({
    success: true,
    design: {
      cameraHeight: design.cameraHeight,
      floorVerts: design.floorVerts,
      items: design.items,
    },
  });
});

// === GET /api/dorm-designs/:designId ===
// A shared design of a stock dorm room. Returns the dorm + scene so the
// frontend can rebuild the panorama from the tour config.
router.get("/dorm-designs/:designId", async (req, res) => {
  if (!isValidUploadId(req.params.designId)) {
    return res.status(400).json({ success: false, error: "Invalid design ID" });
  }

  const design = await DormDesign.findOne({ designId: req.params.designId }).lean();
  if (!design) {
    return res.status(404).json({ success: false, error: "Design not found" });
  }

  res.json({
    success: true,
    designId: design.designId,
    dormId: design.dormId,
    sceneId: design.sceneId || "",
    design: {
      cameraHeight: design.cameraHeight,
      floorVerts: design.floorVerts,
      items: design.items,
    },
  });
});

// === PUT /api/dorm-designs/:designId ===
// Upserts a dorm-room design under a client-generated UUID (same open-write
// model as upload designs).
router.put("/dorm-designs/:designId", async (req, res) => {
  if (!isValidUploadId(req.params.designId)) {
    return res.status(400).json({ success: false, error: "Invalid design ID" });
  }

  const dormId = String(req.body.dormId || "").slice(0, 64);
  const dormExists = dormId && (await Dorm.exists({ id: dormId }));
  if (!dormExists) {
    return res.status(400).json({ success: false, error: "Unknown dormId" });
  }

  const cameraHeight = Number(req.body.cameraHeight);
  const floorVerts = Array.isArray(req.body.floorVerts) ? req.body.floorVerts : [];
  const items = Array.isArray(req.body.items) ? req.body.items : [];

  const design = await DormDesign.findOneAndUpdate(
    { designId: req.params.designId },
    {
      dormId,
      sceneId: String(req.body.sceneId || "").slice(0, 64),
      cameraHeight: Number.isFinite(cameraHeight) ? cameraHeight : 1.4,
      floorVerts,
      items: items.map((it) => ({
        id: String(it.id || "").slice(0, 64),
        x: Number(it.x) || 0,
        z: Number(it.z) || 0,
        rotY: Number(it.rotY) || 0,
      })),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  ).lean();

  res.json({
    success: true,
    designId: design.designId,
    dormId: design.dormId,
    sceneId: design.sceneId || "",
    design: {
      cameraHeight: design.cameraHeight,
      floorVerts: design.floorVerts,
      items: design.items,
    },
  });
});

module.exports = {
  router,
  isValidUploadId,
  getUploadRecord,
  saveUploadRecord: async (metadata) => {
    return RoomUpload.findOneAndUpdate(
      { uploadId: metadata.uploadId },
      {
        uploadId: metadata.uploadId,
        kind: metadata.kind,
        dormId: metadata.dormId,
        roomType: metadata.roomType,
        roomName: metadata.roomName || "",
        userEmail: metadata.userEmail || "",
        originalNames: metadata.originalNames || [],
        savedFiles: metadata.savedFiles || [],
        fileSizes: metadata.fileSizes || [],
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  },
};
