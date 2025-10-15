// models/UserProgress.js
import mongoose from 'mongoose';

const UserProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  field: { type: mongoose.Schema.Types.ObjectId, ref: 'Field', required: true },
  questionsAnswered: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answer: String,
    isCorrect: { type: Boolean, default: false }
  }],
  totalCorrect: { type: Number, default: 0 },
  totalAnswered: { type: Number, default: 0 },
});

export default mongoose.model('UserProgress', UserProgressSchema);
