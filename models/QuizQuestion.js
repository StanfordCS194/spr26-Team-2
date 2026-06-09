const { mongoose } = require("../db");

const quizOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    tags: [{ type: String }],
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true, unique: true },
    text: { type: String, required: true },
    options: [quizOptionSchema],
  },
  { timestamps: true, versionKey: false }
);

module.exports =
  mongoose.models.QuizQuestion || mongoose.model("QuizQuestion", quizQuestionSchema);
