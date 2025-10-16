import mongoose from "mongoose";

const OptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema({
 
  field: { type: mongoose.Schema.Types.ObjectId, ref: "Field", required: true },
  type: { type: String, enum: ["mcq", "descriptive"], default: "mcq" },
  text: { type: String, required: true },
  options: [OptionSchema],
  correctAnswer: { type: String },  
  solution: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Question", QuestionSchema);
