import mongoose from 'mongoose';

// Define schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allows null or missing email
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    mobile: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allows null or missing mobile
      match: [/^\d{7,15}$/, 'Invalid mobile number'], // basic pattern
    },
    password_hash: {
      type: String,
      required: [true, 'Password hash required'],
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// ⚙️ Optional: ensure indexes are recreated correctly
// This prevents issues if old indexes (non-sparse unique) already exist
userSchema.pre('save', async function (next) {
  try {
    if (mongoose.models.User && mongoose.models.User.collection) {
      await mongoose.models.User.collection.createIndex(
        { email: 1 },
        { unique: true, sparse: true }
      );
      await mongoose.models.User.collection.createIndex(
        { mobile: 1 },
        { unique: true, sparse: true }
      );
    }
  } catch (err) {
    console.error('Index creation error:', err.message);
  }
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
