const { mongoose } = require("../db");

// A community-created school: anyone can spin up "TreeView for their school",
// add residences, and attach room uploads (panoramas) to each one.
const schoolDormSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const schoolSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    location: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    dorms: [schoolDormSchema],
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.School || mongoose.model("School", schoolSchema);
