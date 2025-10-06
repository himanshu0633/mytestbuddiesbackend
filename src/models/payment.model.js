import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  order_id: { type: String, required: true, unique: true },
  method: { type: String, enum: ['UPI_UTR'], default: 'UPI_UTR' },
  utr: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending','success','failed'], default: 'pending' },
  screenshot_url: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

paymentSchema.index({ utr: 1, status: 1 });

export default mongoose.model('Payment', paymentSchema);
