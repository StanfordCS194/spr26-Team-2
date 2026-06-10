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
const Review = require("../models/Review");
const DormDesign = require("../models/DormDesign");
const School = require("../models/School");
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
  const [dorms, landmarks, quizQuestions, ratingAgg] = await Promise.all([
    Dorm.find().sort({ name: 1 }).lean(),
    Landmark.find().sort({ sortOrder: 1 }).lean(),
    QuizQuestion.find().sort({ order: 1 }).lean(),
    // Real resident star ratings (user-submitted reviews) per dorm — feeds
    // the rankings so scores reflect genuine feedback, not just heuristics.
    Review.aggregate([
      { $match: { rating: { $gte: 1 } } },
      { $group: { _id: "$dormId", avgRating: { $avg: "$rating" }, ratingCount: { $sum: 1 } } },
    ]),
  ]);

  const ratingsByDorm = Object.fromEntries(
    ratingAgg.map((r) => [r._id, { avgRating: r.avgRating, ratingCount: r.ratingCount }])
  );
  dorms.forEach((d) => {
    const r = ratingsByDorm[d.id];
    d.avgRating = r ? Math.round(r.avgRating * 10) / 10 : null;
    d.ratingCount = r ? r.ratingCount : 0;
  });

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

function serializeReview(r) {
  return {
    id: String(r._id),
    dormId: r.dormId,
    displayName: r.anonymous ? "Anonymous" : (r.author || "Anonymous"),
    rating: r.rating || null,
    body: r.body,
    source: r.source || "",
    curated: Boolean(r.curated),
    createdAt: r.createdAt,
  };
}

// === GET /api/dorms/:dormId/reviews ===
// User-submitted reviews first (newest first), then curated reference quotes.
router.get("/dorms/:dormId/reviews", async (req, res) => {
  const reviews = await Review.find({ dormId: req.params.dormId })
    .sort({ curated: 1, createdAt: -1 })
    .lean();
  res.json({ success: true, reviews: reviews.map(serializeReview) });
});

// === POST /api/dorms/:dormId/reviews ===
// Anyone can post a public review; set anonymous:true to hide the name.
router.post("/dorms/:dormId/reviews", async (req, res) => {
  const dorm = await Dorm.findOne({ id: req.params.dormId }).lean();
  if (!dorm) {
    return res.status(404).json({ success: false, error: "Dorm not found" });
  }

  const body = typeof req.body.body === "string" ? req.body.body.trim().slice(0, 2000) : "";
  if (!body) {
    return res.status(400).json({ success: false, error: "Review text is required" });
  }

  const anonymous = Boolean(req.body.anonymous);
  const author = anonymous
    ? ""
    : (typeof req.body.author === "string" ? req.body.author.trim().slice(0, 60) : "");

  const ratingNum = Number(req.body.rating);
  const rating =
    Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5
      ? Math.round(ratingNum)
      : undefined;

  const review = await Review.create({
    dormId: dorm.id,
    body,
    author,
    anonymous,
    rating,
    curated: false,
  });

  res.status(201).json({ success: true, review: serializeReview(review.toObject()) });
});

// ===================== Multi-school: build TreeView for any campus =====================

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

function serializeSchool(s) {
  return {
    slug: s.slug,
    name: s.name,
    location: s.location || "",
    dorms: s.dorms || [],
    createdAt: s.createdAt,
  };
}

// === GET /api/schools ===
router.get("/schools", async (_req, res) => {
  const schools = await School.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ success: true, schools: schools.map(serializeSchool) });
});

// === POST /api/schools ===
// Create a new school. Body: { name, location? }
router.post("/schools", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim().slice(0, 80) : "";
  if (name.length < 2) {
    return res.status(400).json({ success: false, error: "School name is required" });
  }
  const slug = slugify(name);
  if (!slug) {
    return res.status(400).json({ success: false, error: "School name must include letters or numbers" });
  }

  const existing = await School.findOne({ slug }).lean();
  if (existing) {
    return res.status(409).json({ success: false, error: "That school already exists", school: serializeSchool(existing) });
  }

  const location = typeof req.body.location === "string" ? req.body.location.trim().slice(0, 120) : "";
  const school = await School.create({ slug, name, location, dorms: [] });
  res.status(201).json({ success: true, school: serializeSchool(school.toObject()) });
});

// === GET /api/schools/:slug ===
// School + its dorms + the panorama/room uploads attached to each dorm.
router.get("/schools/:slug", async (req, res) => {
  const school = await School.findOne({ slug: req.params.slug }).lean();
  if (!school) {
    return res.status(404).json({ success: false, error: "School not found" });
  }

  const uploads = await RoomUpload.find({ schoolSlug: school.slug })
    .sort({ createdAt: -1 })
    .lean();

  const uploadsByDorm = {};
  uploads.forEach((u) => {
    if (!uploadsByDorm[u.dormId]) uploadsByDorm[u.dormId] = [];
    uploadsByDorm[u.dormId].push({
      uploadId: u.uploadId,
      kind: u.kind,
      roomName: u.roomName || "",
      savedFiles: u.savedFiles || [],
      createdAt: u.createdAt,
    });
  });

  res.json({ success: true, school: serializeSchool(school), uploadsByDorm });
});

// === POST /api/schools/:slug/dorms ===
// Add a residence to a school. Body: { name }
router.post("/schools/:slug/dorms", async (req, res) => {
  const school = await School.findOne({ slug: req.params.slug });
  if (!school) {
    return res.status(404).json({ success: false, error: "School not found" });
  }

  const name = typeof req.body.name === "string" ? req.body.name.trim().slice(0, 80) : "";
  if (name.length < 2) {
    return res.status(400).json({ success: false, error: "Residence name is required" });
  }

  const id = slugify(name);
  if (!id) {
    return res.status(400).json({ success: false, error: "Residence name must include letters or numbers" });
  }
  if (school.dorms.some((d) => d.id === id)) {
    return res.status(409).json({ success: false, error: "That residence already exists for this school" });
  }

  school.dorms.push({ id, name });
  await school.save();
  res.status(201).json({ success: true, school: serializeSchool(school.toObject()) });
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
        schoolSlug: metadata.schoolSlug || "",
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
