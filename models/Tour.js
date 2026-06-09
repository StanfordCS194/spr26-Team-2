const { mongoose } = require("../db");

const tourSchema = new mongoose.Schema(
  {
    dormId: { type: String, required: true, unique: true, index: true },
    config: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.Tour || mongoose.model("Tour", tourSchema);
