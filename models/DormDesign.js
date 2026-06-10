const { mongoose } = require("../db");

// A shareable design of a stock dorm room (pre-uploaded tour panorama).
// Unlike RoomDesign there is no upload behind it, so the record carries the
// dorm + scene needed to rebuild the panorama from the tour config.
const furnitureItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    x: { type: Number, required: true },
    z: { type: Number, required: true },
    rotY: { type: Number, default: 0 },
  },
  { _id: false }
);

const dormDesignSchema = new mongoose.Schema(
  {
    designId: { type: String, required: true, unique: true, index: true },
    dormId: { type: String, required: true },
    sceneId: { type: String, default: "" },
    cameraHeight: { type: Number, default: 1.4 },
    floorVerts: [[Number]],
    items: [furnitureItemSchema],
  },
  { timestamps: true, versionKey: false }
);

module.exports =
  mongoose.models.DormDesign || mongoose.model("DormDesign", dormDesignSchema);
