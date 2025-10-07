import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export default async function connectMongo() {
  // const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quiz_app';
  const uri = process.env.MONGO_URI || 'mongodb+srv://himanshujangra0633_db_user:Mytestbuddies@cluster0.lo468v5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { autoIndex: true });
  console.log('Connected to MongoDB');
}
