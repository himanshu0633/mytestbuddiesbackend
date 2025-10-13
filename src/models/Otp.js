// models/Otp.js
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    lastSentAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 }, // verify attempts
  },
  { timestamps: true }
);

// TTL index for auto-delete (Mongo will remove after expiry)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Otp', otpSchema);
