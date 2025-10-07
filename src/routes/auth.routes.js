import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import User from '../models/user.model.js';  // Ensure default export in user.model.js

dotenv.config();
const router = Router();

// Helper: generate token safely
function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('Server misconfigured: JWT_SECRET not set');
  }
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// File upload setup for QR Code or Image using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

// REGISTER USER
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    // Validate required fields
    if (!name || !password || (!email && !mobile) || !role) {
      return res.status(400).json({
        error: 'Missing fields (name, password, email or mobile, and role are required)',
      });
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Normalize inputs
    const data = {
      name: String(name).trim(),
      email: email ? String(email).trim().toLowerCase() : undefined,
      mobile: mobile ? String(mobile).trim() : undefined,
      role: String(role).trim(), // either 'student' or 'general'
    };

    // Duplicate check (before create)
    const exists = await User.findOne({
      $or: [
        ...(data.email ? [{ email: data.email }] : []),
        ...(data.mobile ? [{ mobile: data.mobile }] : []),
      ],
    });

    if (exists) {
      return res.status(409).json({
        error:
          exists.email === data.email
            ? 'Email already registered'
            : 'Mobile already registered',
      });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      password_hash: hash,
      role: data.role,
      paymentStatus: 'pending', // Set initial payment status to "pending"
    });

    // Generate JWT token
    let token;
    try {
      token = signToken(user);
    } catch (signErr) {
      // Rollback user if token signing fails
      await User.deleteOne({ _id: user._id });
      console.error('JWT sign failed:', signErr.message);
      return res.status(500).json({ error: 'Failed to generate token' });
    }

    return res.json({ token });
  } catch (e) {
    console.error('Register error:', e);

    // Duplicate key fallback
    if (e && e.code === 11000) {
      const key = Object.keys(e.keyPattern || e.keyValue || {})[0] || 'field';
      return res
        .status(409)
        .json({ error: `${key.charAt(0).toUpperCase() + key.slice(1)} already registered` });
    }

    return res.status(400).json({ error: 'Invalid data' });
  }
});

// LOGIN USER
router.post('/login', async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    if (!password || (!email && !mobile)) {
      return res.status(400).json({ error: 'Missing credentials (password + email or mobile)' });
    }

    const query = email
      ? { email: String(email).toLowerCase().trim() }
      : { mobile: String(mobile).trim() };

    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    return res.json({ token });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET CURRENT USER (for user info after login)
router.get('/me', async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.json(null);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name email mobile role');
    return res.json(user);
  } catch (err) {
    console.error('Token verify error:', err);
    return res.json(null);
  }
});

// UPLOAD PROOF (Transaction ID or QR code)
router.post('/upload-proof/:userId', upload.single('qrCode'), async (req, res) => {
  const userId = req.params.userId;
  const qrCode = req.file ? req.file.path : req.body.transactionId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.qrCode = qrCode;
    await user.save();

    res.json({ message: 'Proof uploaded successfully' });
  } catch (error) {
    console.error('Error uploading proof:', error);
    res.status(500).json({ error: 'Error uploading proof' });
  }
});

// Admin Approval Endpoint (for updating payment status to 'paid')
router.put('/approve/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Change the payment status to "paid"
    user.paymentStatus = 'paid';
    await user.save();

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Error approving user' });
  }
});

export default router;
