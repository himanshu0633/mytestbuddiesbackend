import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export default async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quiz_app';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { autoIndex: true });
  console.log('Connected to MongoDB');
}
