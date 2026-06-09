const { mongoose } = require("../db");

const furnitureItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    x: { type: Number, required: true },
    z: { type: Number, required: true },
    rotY: { type: Number, default: 0 },
  },
  { _id: false }
);

const roomDesignSchema = new mongoose.Schema(
  {
    uploadId: { type: String, required: true, unique: true, index: true },
    cameraHeight: { type: Number, default: 1.4 },
    floorVerts: [[Number]],
    items: [furnitureItemSchema],
  },
  { timestamps: true, versionKey: false }
);

module.exports =
  mongoose.models.RoomDesign || mongoose.model("RoomDesign", roomDesignSchema);
