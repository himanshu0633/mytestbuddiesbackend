import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  attempt_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt', required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selected_index: { type: Number },
  time_spent_seconds: { type: Number, default: 0 },
}, { timestamps: { updatedAt: 'updated_at', createdAt: 'created_at' } });

answerSchema.index({ attempt_id: 1, question_id: 1 }, { unique: true });

export default mongoose.model('Answer', answerSchema);
