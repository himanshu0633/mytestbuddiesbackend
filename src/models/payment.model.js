import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  utr: { type: String },
  paymentstatus: { type: String, enum: ['pending','success','failed'], default: 'pending' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

paymentSchema.index({ utr: 1, status: 1 });

export default mongoose.model('Payment', paymentSchema);
