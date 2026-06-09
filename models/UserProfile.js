const { mongoose } = require("../db");

const userProfileSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, unique: true, index: true },
    shortlist: [{ type: String }],
    notes: { type: Map, of: String, default: {} },
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    lastDormId: { type: String, default: "" },
    lastRoomType: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

module.exports =
  mongoose.models.UserProfile || mongoose.model("UserProfile", userProfileSchema);
