import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true },
    mobile: { type: String, unique: true },
    password: { type: String, minlength: 6 },
    userType: { type: String, enum: ['student', 'general'] },
    utr: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'verified'], default: 'pending' },
    proofOfPayment: { type: String },
  },
  { timestamps: true }
);

// Pre-save hook to hash the password before saving
userSchema.pre('save', async function (next) {
  console.log('Saving user:', this); // Log user data before saving, including unmodified password
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log('Password hashed:', this.password); // Log the hashed password (for debugging purposes, but avoid logging in production)
  next();
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function (password) {
  console.log('Comparing password for user:', this.email || this.mobile); // Log the user email/mobile while comparing
  const isMatch = await bcrypt.compare(password, this.password);
  console.log('Password comparison result:', isMatch); // Log if password matches or not
  return isMatch;
};

const user = mongoose.model('User', userSchema);

export default user;
