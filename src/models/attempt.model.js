import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  started_at: Date,
  submitted_at: Date,
  status: { type: String, enum: ['not_started','in_progress','submitted'], default: 'not_started' },
  score: { type: Number, default: 0 },
}, { timestamps: true });

attemptSchema.index({ user_id: 1, quiz_id: 1 }, { unique: true });

export default mongoose.model('Attempt', attemptSchema);
