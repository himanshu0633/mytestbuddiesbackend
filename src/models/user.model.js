import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// User Schema definition
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
  },
  mobile: {
    type: String,
    required: false,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ['student', 'general'],
    required: true,
  },
  qrCode: {
    type: String, // Store the transaction ID or path to uploaded QR code image
    required: false,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving user
userSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

// Export the User model
export default User;
