import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  subject: String,
  difficulty: { type: String, enum: ['easy','medium','hard'], default: 'easy' },
  statement: { type: String, required: true },
  options: [{ type: String, required: true }],
  correct_index: { type: Number, required: true },
  marks: { type: Number, default: 4.0 },
  negative_marks: { type: Number, default: 1.0 },
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);
