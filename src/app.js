// app.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import connectMongo from './db/mongo.js';

import userRoutes from './routes/adminuser.js';
import adminRoutes from './routes/admin.js'; 
import fieldRoutes from "./routes/fieldRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
// Use bcryptjs to avoid native build issues
import bcrypt from 'bcryptjs';
import User from './models/user.js';

// Load env (adjust if your .env path differs)
dotenv.config({ path: '../.env' });
  
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trust proxy - CRITICAL FIX for rate limiting behind reverse proxy
app.set('trust proxy', 1); // Trust first proxy

// Security + parsers
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ----------------------------- CORS Configuration ----------------------------- */
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

console.log('CORS allowed origins:', allowedOrigins);

// SIMPLIFIED CORS - Remove the complex origin function that might cause issues
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204,
};

// Apply CORS ONLY ONCE - remove the app.options('*') line
app.use(cors(corsOptions));
app.use('/admin', adminRoutes);

/* ------------------------- Rate limiters (AFTER CORS) ------------------------- */
const commonLimiterOpts = {
  windowMs: 60 * 1000,
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // never limit preflight
  keyGenerator: (req) => {
    // Use the client's IP address (works with trust proxy)
    return req.ip;
  },
  // Add validation to handle X-Forwarded-For header properly
  validate: {
    trustProxy: true, // Explicitly enable trust proxy for rate limiter
    xForwardedForHeader: true
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.'
    });
  }
};

// Apply rate limiting to specific routes
app.use('/api/auth', rateLimit({ 
  ...commonLimiterOpts, 
  max: 30, // 30 requests per minute for auth
  message: 'Too many authentication attempts, please try again later.'
}));

app.use('/api/payments', rateLimit({ 
  ...commonLimiterOpts, 
  max: 60 // 60 requests per minute for payments
}));

// General rate limiter for all other routes
app.use(rateLimit({
  ...commonLimiterOpts,
  max: 100, // 100 requests per minute for other routes
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.originalUrl === '/healthz' || 
           req.originalUrl.startsWith('/uploads') ||
           req.method === 'OPTIONS';
  }
}));

/* --------------------------------- Static --------------------------------- */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* --------------------------------- Routes --------------------------------- */
app.use('/api/auth', userRoutes);

app.use("/api/admin/fields", fieldRoutes);
app.use("/api/admin/questions", questionRoutes);
// Simple health endpoint (useful for uptime checks)

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ 
    message: 'MyTestBuddies API Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

/* ------------------------------ Bootstrapping ------------------------------ */
const PORT = process.env.PORT || 5000;

// Seed admin user if not exists
async function seed() {
  try {
    const adminEmail = 'admin@example.com';
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hash = await bcrypt.hash('Admin@123', 10);
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password_hash: hash,
        role: 'admin',
      });
      console.log('Seeded admin user.');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

// Connect to MongoDB and start server
connectMongo()
  .then(async () => {
    console.log('MongoDB connected successfully');
    await seed();
    
    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });
  })
  .catch(err => {
    console.error('Mongo connection failed:', err);
    process.exit(1);
  });

export default app;