const { mongoose } = require("../db");

const landmarkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    emoji: { type: String, default: "" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.Landmark || mongoose.model("Landmark", landmarkSchema);
