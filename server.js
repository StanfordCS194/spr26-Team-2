const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOADS_DIR = path.join(__dirname, "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 6;
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_NAMES = [
  "01-north",
  "02-south",
  "03-east",
  "04-west",
  "05-ceiling",
  "06-floor",
];
const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
// Serve the existing static frontend so http://localhost:3000 loads index.html
app.use(express.static(path.join(__dirname, "treeview")));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: (req, file, cb) => {
    if (ACCEPTED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, or WebP files are allowed"));
    }
  },
});

// Strip anything that could enable path traversal or messy directory names
function sanitize(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

app.post("/api/upload", (req, res) => {
  upload.array("photos", MAX_FILES)(req, res, (err) => {
    if (err) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 400 : 400;
      console.error("[upload error]", err.message);
      return res.status(status).json({
        success: false,
        error: err.message,
      });
    }

    const files = req.files || [];

    if (files.length !== MAX_FILES) {
      return res.status(400).json({
        success: false,
        error: `Expected ${MAX_FILES} photos, received ${files.length}`,
      });
    }

    const dormId = sanitize(req.body.dormId);
    const roomType = sanitize(req.body.roomType);
    const userEmail = (req.body.userEmail || "").toString().slice(0, 200);

    if (!dormId || !roomType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: dormId or roomType",
      });
    }

    const uploadId = randomUUID();
    const uploadDir = path.join(UPLOADS_DIR, uploadId);

    try {
      fs.mkdirSync(uploadDir, { recursive: true });

      const savedFiles = [];
      const originalNames = [];

      files.forEach((file, i) => {
        const ext = EXT_BY_MIME[file.mimetype] || ".jpg";
        const filename = PHOTO_NAMES[i] + ext;
        fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
        savedFiles.push(filename);
        originalNames.push(file.originalname);
      });

      const metadata = {
        uploadId,
        dormId,
        roomType,
        userEmail,
        timestamp: new Date().toISOString(),
        originalNames,
        savedFiles,
        fileSizes: files.map((f) => f.size),
      };

      fs.writeFileSync(
        path.join(uploadDir, "metadata.json"),
        JSON.stringify(metadata, null, 2)
      );

      const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
      console.log(
        `[${uploadId}] received 6 photos for ${dormId}/${roomType} (${(
          totalBytes /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );

      res.json({
        success: true,
        uploadId,
        message: "Photos received",
      });
    } catch (writeErr) {
      console.error("[write error]", writeErr);
      res.status(500).json({
        success: false,
        error: "Failed to save photos",
      });
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`TreeView server listening on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});
