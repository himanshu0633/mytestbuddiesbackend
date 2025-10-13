// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      // required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    mobile: {
      type: String,
      // required: true,
      unique: true,
      trim: true,
      match: /^\d{10}$/, // exactly 10 digits
      index: true,
    },
    userType: {
      type: String,
      enum: ['student', 'general'],
      // required: true,
      lowercase: true,
      trim: true,
    },

    // ✅ New fields for secure auth
    passwordHash: {
      type: String,
      // required: true, // we always store the hash
      select: false,  // exclude from find() by default
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Optional quality-of-life flags
    disabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

/** Instance Methods **/

// setPassword: hash and set passwordHash
userSchema.methods.setPassword = async function setPassword(plain) {
  if (!plain || String(plain).length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(String(plain), salt);
};

// comparePassword: compare with stored hash
userSchema.methods.comparePassword = async function comparePassword(plain) {
  // if passwordHash is not selected, fetch it explicitly
  if (!this.passwordHash) {
    const fresh = await this.constructor.findById(this._id).select('+passwordHash');
    if (!fresh || !fresh.passwordHash) return false;
    return bcrypt.compare(String(plain), fresh.passwordHash);
  }
  return bcrypt.compare(String(plain), this.passwordHash);
};

// Hide sensitive fields in JSON
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

/** Indexes (optional but useful) **/
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ mobile: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
export default User;
