// TreeView Backend — Photo Upload Server
// Receives 6 dorm photos from the browser, validates them, and stores them on disk.
// Each upload gets a UUID folder with renamed photos (01-north.jpg, etc.) and metadata.json.

const express = require("express");
const multer = require("multer"); // Middleware to parse multipart form uploads (files)
const cors = require("cors"); // Allow cross-origin requests
const fs = require("fs"); // File system: read/write to disk
const path = require("path"); // Path utilities: join paths safely
const { randomUUID } = require("crypto"); // Generate unique upload IDs

const app = express();
const PORT = process.env.PORT || 3000;

// Where uploaded photos are stored: ./uploads/<uploadId>/<photo-files>
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Upload constraints
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per photo
const MAX_FILES = 6; // Exactly 6 photos required
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"]; // Allowed formats

// Photo labels — used as filenames so the backend knows which wall is which
// User uploads in order: north, south, east, west, ceiling, floor
const PHOTO_NAMES = [
  "01-north",
  "02-south",
  "03-east",
  "04-west",
  "05-ceiling",
  "06-floor",
];

// Map MIME type to file extension (for consistent naming)
const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Create uploads directory if it doesn't exist (runs once on startup)
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware: Enable CORS (browsers can POST from file://)
app.use(cors());
// Middleware: Parse JSON (for non-multipart endpoints)
app.use(express.json());
// Middleware: Serve the frontend from treeview/ so browser can load index.html
// This way http://localhost:3000 loads the UI directly from the server
app.use(express.static(path.join(__dirname, "treeview")));

// Configure multer for file uploads
const upload = multer({
  // Store files in RAM temporarily (not on disk) — we'll write to disk ourselves after validation
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE, // Reject any file > 10MB
    files: MAX_FILES, // Reject if more than 6 files uploaded
  },
  // Custom validation: only accept image MIME types
  fileFilter: (req, file, cb) => {
    if (ACCEPTED_MIME.includes(file.mimetype)) {
      cb(null, true); // Accept file
    } else {
      cb(new Error("Only JPG, PNG, or WebP files are allowed")); // Reject file
    }
  },
});

// Security: Strip out special characters to prevent path traversal attacks
// e.g., "branner" stays "branner", "br@nnér" becomes "brnnr"
// This ensures dormId and roomType can't trick us into writing to unexpected folders
function sanitize(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

// === POST /api/upload ===
// Main endpoint: receives 6 photos + metadata, validates, stores them
app.post("/api/upload", (req, res) => {
  // Step 1: Run multer's middleware to parse and validate the uploaded files
  upload.array("photos", MAX_FILES)(req, res, (err) => {
    // If multer found an error (bad MIME, file too large, etc.), reject immediately
    if (err) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 400 : 400;
      console.error("[upload error]", err.message);
      return res.status(status).json({
        success: false,
        error: err.message,
      });
    }

    // Step 2: Verify we got exactly 6 files (multer validates count, but double-check)
    const files = req.files || [];
    if (files.length !== MAX_FILES) {
      return res.status(400).json({
        success: false,
        error: `Expected ${MAX_FILES} photos, received ${files.length}`,
      });
    }

    // Step 3: Extract and sanitize the metadata from form fields
    const dormId = sanitize(req.body.dormId); // e.g., "branner"
    const roomType = sanitize(req.body.roomType); // e.g., "single"
    const userEmail = (req.body.userEmail || "").toString().slice(0, 200);

    // Step 4: Verify required fields are present
    if (!dormId || !roomType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: dormId or roomType",
      });
    }

    // Step 5: Generate a unique folder for this upload batch
    const uploadId = randomUUID(); // e.g., "a3f9c1d2-4e5b-..."
    const uploadDir = path.join(UPLOADS_DIR, uploadId); // e.g., "./uploads/a3f9c1d2-..."

    try {
      // Step 6: Create the upload folder (recursive: true handles nested missing dirs)
      fs.mkdirSync(uploadDir, { recursive: true });

      // Step 7: Write each photo to disk with a standardized name
      const savedFiles = [];
      const originalNames = [];

      files.forEach((file, i) => {
        // Get file extension from MIME type (jpg for image/jpeg, etc.)
        const ext = EXT_BY_MIME[file.mimetype] || ".jpg";
        // Build filename: 01-north.jpg, 02-south.png, etc.
        const filename = PHOTO_NAMES[i] + ext;
        // Write file.buffer (in-memory bytes) to disk
        fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
        // Track what we saved
        savedFiles.push(filename);
        originalNames.push(file.originalname);
      });

      // Step 8: Create a metadata.json file alongside the photos
      // This helps Phase 3 (3D processing) understand what dorm/room this upload is for
      const metadata = {
        uploadId,
        dormId,
        roomType,
        userEmail,
        timestamp: new Date().toISOString(), // When the upload happened
        originalNames, // Original filenames from browser
        savedFiles, // Our standardized names (01-north.jpg, etc.)
        fileSizes: files.map((f) => f.size), // File sizes in bytes
      };

      fs.writeFileSync(
        path.join(uploadDir, "metadata.json"),
        JSON.stringify(metadata, null, 2) // Pretty-print JSON (null, 2)
      );

      // Step 9: Log successful upload (helps debug issues)
      const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
      console.log(
        `[${uploadId}] received 6 photos for ${dormId}/${roomType} (${(
          totalBytes /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );

      // Step 10: Send success response with the uploadId
      // Browser uses uploadId to show user a reference number
      res.json({
        success: true,
        uploadId,
        message: "Photos received",
      });
    } catch (writeErr) {
      // If anything goes wrong writing to disk, return a 500 error
      console.error("[write error]", writeErr);
      res.status(500).json({
        success: false,
        error: "Failed to save photos",
      });
    }
  });
});

// === GET /api/health ===
// Simple health check: returns { ok: true } to confirm the server is alive
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// === Startup ===
// Start the Express server
app.listen(PORT, () => {
  console.log(`TreeView server listening on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});
