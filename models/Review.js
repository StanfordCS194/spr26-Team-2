const { mongoose } = require("../db");

const reviewSchema = new mongoose.Schema(
  {
    dormId: { type: String, required: true, index: true },
    author: { type: String, default: "" },
    anonymous: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 },
    body: { type: String, required: true },
    // For curated/sourced reviews: where the quote came from (Reddit, Roomsurf, etc.).
    source: { type: String, default: "" },
    // true = seeded reference quote; false = a real user-submitted review.
    curated: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);
