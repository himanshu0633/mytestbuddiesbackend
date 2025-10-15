// controllers/userController.js
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // ✅ bcryptjs: cross-platform friendly
import User from '../models/user.js';
import Otp from '../models/Otp.js';
import dotenv from 'dotenv';
import { sendOtpEmail, sendPoliciesEmail } from '../lib/mailer.js';

dotenv.config({ path: '../.env' });

// ===== Multer (kept for future use; not needed for registration now) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
export const upload = multer({ storage });

// ===== Config (ENV-driven with fallbacks) =====
const OTP_LENGTH = 6;
const OTP_EXP_MIN = Number(process.env.OTP_EXP_MIN || 10);         // minutes
const RESEND_COOLDOWN = Number(process.env.RESEND_COOLDOWN || 30); // seconds
const MAX_VERIFY_ATTEMPTS = Number(process.env.MAX_VERIFY_ATTEMPTS || 5);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ===== Helpers =====
const sendErr = (res, code, message) => res.status(code).json({ ok: false, message });
const sendOK = (res, payload = {}) => res.json({ ok: true, ...payload });

function normEmail(v = '') { return String(v || '').trim().toLowerCase(); }
function normMobile(v = '') { return String(v || '').replace(/\D/g, ''); } // keep digits only
function isEmail(v = '') { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); }
function isTenDigitMobile(v = '') { return /^\d{10}$/.test(String(v || '').trim()); }
function requiredFields(body, fields) { return fields.filter((f) => !String(body[f] ?? '').trim()); }
function generateOtp() {
  // strictly 6-digit numeric OTP
  return String(Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * 9 * 10 ** (OTP_LENGTH - 1)));
}

// 🔍 Make a compact error summary for email failures
function summarizeMailError(e) {
  if (!e) return { message: 'unknown error' };
  return {
    message: e.message || String(e),
    code: e.code || null,               // e.g., EAUTH, ETIMEDOUT
    responseCode: e.responseCode || null, // SMTP status code if any
    response: e.response || null,       // raw SMTP response (useful for Gmail policy blocks)
    command: e.command || null,         // SMTP command that failed
    host: e.hostname || e.host || null,
    port: e.port || null,
  };
}

// ================= OTP: SEND ==================
// POST /auth/send-otp  { email }
export const sendOtp = async (req, res) => {
  try {
    const emailRaw = req.body?.email ?? '';
    const email = normEmail(emailRaw);
    if (!email || !isEmail(email)) return sendErr(res, 400, 'Valid email is required');

    const now = new Date();
    let rec = await Otp.findOne({ email });

    // cooldown
    if (rec && (now - rec.lastSentAt) / 1000 < RESEND_COOLDOWN) {
      const wait = RESEND_COOLDOWN - Math.floor((now - rec.lastSentAt) / 1000);
      return sendErr(res, 429, `Please wait ${wait}s before resending`);
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXP_MIN * 60 * 1000);

    if (rec) {
      rec.otpHash = otpHash;
      rec.expiresAt = expiresAt;
      rec.lastSentAt = now;
      rec.attempts = 0;
      await rec.save();
    } else {
      await Otp.create({ email, otpHash, expiresAt, lastSentAt: now, attempts: 0 });
    }

    await sendOtpEmail(email, otp);
    return sendOK(res, { message: 'OTP sent' });
  } catch (err) {
    console.error('send-otp error:', err);
    return sendErr(res, 500, 'Failed to send OTP');
  }
};

// ================= OTP: VERIFY ==================
// POST /auth/verify-otp  { email, otp }
export const verifyOtp = async (req, res) => {
  try {
    const email = normEmail(req.body?.email);
    const otp = String(req.body?.otp ?? '').trim();

    if (!email || !isEmail(email) || !otp) {
      return sendErr(res, 400, 'Email and OTP are required');
    }

    const rec = await Otp.findOne({ email });
    if (!rec) return sendErr(res, 400, 'OTP not found. Please request again.');

    if (rec.attempts >= MAX_VERIFY_ATTEMPTS) {
      return sendErr(res, 429, 'Too many attempts. Request new OTP.');
    }
    if (new Date() > rec.expiresAt) {
      return sendErr(res, 400, 'OTP expired. Request new OTP.');
    }

    const ok = await bcrypt.compare(otp, rec.otpHash);
    rec.attempts += 1;
    await rec.save();

    if (!ok) return sendErr(res, 400, 'Invalid OTP');

    return sendOK(res, { message: 'OTP verified' });
  } catch (err) {
    console.error('verify-otp error:', err);
    return sendErr(res, 500, 'Verification failed');
  }
};

// ================= REGISTER (after OTP verified) ==================
// POST /auth/register  { name, email, mobile, password, userType }
export const registerUser = async (req, res) => {
  try {
    // normalize inputs
    const name = String(req.body?.name ?? '').trim();
    const email = normEmail(req.body?.email);
    const mobile = normMobile(req.body?.mobile);
    const password = String(req.body?.password ?? '');
    const userType = String(req.body?.userType ?? '').trim().toLowerCase();

    // required
    const missing = requiredFields(
      { name, email, mobile, password, userType },
      ['name', 'email', 'mobile', 'password', 'userType']
    );
    if (missing.length) return sendErr(res, 400, `Missing fields: ${missing.join(', ')}`);

    // format checks
    if (!isEmail(email)) return sendErr(res, 400, 'Enter a valid email');
    if (!isTenDigitMobile(mobile)) return sendErr(res, 400, 'Mobile must be exactly 10 digits');
    if (!['student', 'general'].includes(userType)) return sendErr(res, 400, 'Invalid userType');
    if (password.length < 6) return sendErr(res, 400, 'Password must be at least 6 characters');

    // ensure email was recently verified (OTP exists and not expired)
    const otpRec = await Otp.findOne({ email });
    if (!otpRec || new Date() > otpRec.expiresAt) {
      return sendErr(res, 400, 'Please verify email via OTP first');
    }

    // duplicates (email + mobile)
    const dup = await User.findOne({ $or: [{ email }, { mobile }] });
    if (dup) {
      const field = dup.email === email ? 'Email' : 'Mobile';
      return sendErr(res, 409, `${field} already registered`);
    }

    // create user (hash password -> passwordHash)
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      mobile,
      userType,
      passwordHash,
      emailVerified: true,
    });

    // cleanup OTP (optional)
    await Otp.deleteOne({ email });

    // JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // ✅ Send Policies/Terms email BEFORE sending the response — with deep diagnostics
    let policyEmail = { sent: false };
    try {
      const info = await sendPoliciesEmail(email, {
        website: 'https://mytestbuddies.shop',
        brand: 'MyTestBuddies',
        // effectiveDate omit => auto "today"
        jurisdiction: 'Bengaluru, Karnataka',
        address: 'Bengaluru, Karnataka, India',
      });

      // nodemailer info diagnostics
      policyEmail = {
        sent: true,
        messageId: info?.messageId || null,
        accepted: info?.accepted || [],
        rejected: info?.rejected || [],
        pending: info?.pending || [],
        envelope: info?.envelope || null,
        response: info?.response || null, // SMTP '250 OK ...' string if available
      };

      // console log for server visibility
      console.log('Policies email diagnostics:', policyEmail);
    } catch (e) {
      const summary = summarizeMailError(e);
      policyEmail = { sent: false, ...summary };
      console.error('Policies email failed (diagnostics):', summary);
      // proceed without blocking registration
    }

    return res.status(201).json({
      ok: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        userType: user.userType,
        emailVerified: user.emailVerified,
      },
      token,
      // ⬇️ TEMP DIAGNOSTICS FIELD — remove once issue resolved
      policyEmail,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return sendErr(res, 500, 'Server error during registration');
  }
};

// ================= LOGIN ==================
// POST /auth/login { email?, mobile?, password }
export const loginUser = async (req, res) => {
  try {
    const emailRaw = req.body?.email;
    const mobileRaw = req.body?.mobile;
    const email = emailRaw ? normEmail(emailRaw) : null;
    const mobile = mobileRaw ? normMobile(mobileRaw) : null;
    const password = String(req.body?.password ?? '');
    const role = String(req.body?.role ?? 'user').trim().toLowerCase();

    if (!password || (!email && !mobile)) {
      return sendErr(res, 400, 'Email/mobile and password are required');
    }

    const query = {
      $or: [
        email ? { email } : null,
        mobile ? { mobile } : null,
      ].filter(Boolean),
    };

    const user = await User.findOne(query).select('+passwordHash');
    if (!user) return sendErr(res, 400, 'Invalid credentials');

    // compare password
    let ok = false;
    if (typeof user.comparePassword === 'function') {
      ok = await user.comparePassword(password);
    } else if (user.passwordHash) {
      ok = await bcrypt.compare(password, user.passwordHash);
    }
    if (!ok) return sendErr(res, 400, 'Invalid credentials');

    if (user.disabled) {
      return sendErr(res, 403, 'Account disabled. Contact support.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });

    return sendOK(res, {
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        userType: user.userType,
        emailVerified: user.emailVerified,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendErr(res, 500, 'Server error during login');
  }
};

// ================= ME ==================
export const getMe = async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return sendErr(res, 400, 'No token provided');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name email mobile userType emailVerified lastLoginAt role');
    if (!user) return sendErr(res, 404, 'User not found');
    return sendOK(res, { user });
  } catch (err) {
    console.error('Token verify error:', err);
    return sendErr(res, 401, 'Invalid or expired token');
  }
};
