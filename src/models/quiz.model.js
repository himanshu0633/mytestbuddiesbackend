import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tags: [{ type: String }],
  syllabus: String,
  price: { type: Number, default: 0 },
  duration_minutes: { type: Number, required: true },
  start_at: Date,
  end_at: Date,
  status: { type: String, enum: ['draft','published','closed'], default: 'draft' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('Quiz', quizSchema);
