import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectMongo from './db/mongo.js';  // Mongo connection function

import userRoutes from './routes/adminuser.js';
import quizRoutes from './routes/quiz.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';

import bcrypt from 'bcrypt';
import User from './models/user.js';

dotenv.config();  // Load environment variables from .env

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up CORS
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || [];
console.log('CORS allowed origins:', allowedOrigins);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  }
  next();
});

// Handle pre-flight requests (OPTIONS)
app.options('*', (req, res) => {
  res.status(200).send();
});

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 60*1000, max: 30 }));
app.use('/api/payments', rateLimit({ windowMs: 60*1000, max: 60 }));

// Static for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

// Seed admin user if not exists
async function seed() {
  const adminEmail = 'admin@example.com';
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hash = await bcrypt.hash('Admin@123', 10);
    await User.create({ name: 'Admin', email: adminEmail, password_hash: hash, role: 'admin' });
    console.log('Seeded admin user.');
  }
}

// Connect to MongoDB and start server
connectMongo().then(async () => {
  await seed();
  app.listen(PORT, () => console.log('Server running on port', PORT));
}).catch(err => {
  console.error('Mongo connection failed:', err);
  process.exit(1);
});
