const { mongoose } = require("../db");

const roomUploadSchema = new mongoose.Schema(
  {
    uploadId: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ["sixPhoto", "pano"], required: true },
    dormId: { type: String, required: true },
    roomType: { type: String, required: true },
    roomName: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    originalNames: [{ type: String }],
    savedFiles: [{ type: String }],
    fileSizes: [{ type: Number }],
  },
  { timestamps: true, versionKey: false }
);

module.exports =
  mongoose.models.RoomUpload || mongoose.model("RoomUpload", roomUploadSchema);
