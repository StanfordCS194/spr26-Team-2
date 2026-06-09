const { mongoose } = require("../db");

const dormSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, enum: ["frosh", "four_class"], required: true },
    roomTypes: [{ type: String }],
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    extraTags: [{ type: String }],
    communityBonus: { type: Number, default: 0 },
    hasTour: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.Dorm || mongoose.model("Dorm", dormSchema);
