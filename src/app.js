import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectMongo from './db/mongo.js';

import userRoutes from './routes/adminuser.js';
import quizRoutes from './routes/quiz.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';

import bcrypt from 'bcrypt';
import User from './models/user.js';
import Quiz from './models/quiz.model.js';
import Question from './models/question.model.js';

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowed = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || ['http://localhost:5173'];
app.use(cors({ origin: allowed, credentials: true }));

app.use('/api/auth', rateLimit({ windowMs: 60*1000, max: 30 }));
app.use('/api/payments', rateLimit({ windowMs: 60*1000, max: 60 }));

// static for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// routes
app.use('/api/auth', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 4000;

async function seed() {
  // Admin user
  const adminEmail = 'admin@example.com';
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hash = await bcrypt.hash('Admin@123', 10);
    await User.create({ name: 'Admin', email: adminEmail, password_hash: hash, role: 'admin' });
    console.log('Seeded admin user.');
  }

  // Sample quiz
  // let quiz = await Quiz.findOne({ title: 'JEE Sample Test 1' });
  // if (!quiz) {
  //   quiz = await Quiz.create({
  //     title: 'JEE Sample Test 1',
  //     tags: ['JEE Main','Physics','Chemistry','Maths'],
  //     syllabus: 'PCM basics',
  //     price: 99,
  //     duration_minutes: 30,
  //     status: 'published'
  //   });
  //   await Question.insertMany([
  //     {
  //       quiz_id: quiz._id,
  //       subject: 'Physics',
  //       difficulty: 'easy',
  //       statement: 'Speed of light is?',
  //       options: ['3x10^8 m/s','1 m/s','340 m/s','10 m/s'],
  //       correct_index: 0,
  //       marks: 4.0,
  //       negative_marks: 1.0,
  //     },
  //     {
  //       quiz_id: quiz._id,
  //       subject: 'Chemistry',
  //       difficulty: 'easy',
  //       statement: 'H2O is?',
  //       options: ['Hydrogen','Oxygen','Water','Helium'],
  //       correct_index: 2,
  //       marks: 4.0,
  //       negative_marks: 1.0,
  //     },
  //     {
  //       quiz_id: quiz._id,
  //       subject: 'Maths',
  //       difficulty: 'easy',
  //       statement: '2+2=?',
  //       options: ['3','4','5','2'],
  //       correct_index: 1,
  //       marks: 4.0,
  //       negative_marks: 1.0,
  //     },
  //   ]);
  //   console.log('Seeded sample quiz & questions.');
  // }
}

connectMongo().then(async () => {
  await seed();
  app.listen(PORT, () => console.log('Server running on port', PORT));
}).catch(err => {
  console.error('Mongo connection failed:', err);
  process.exit(1);
});
