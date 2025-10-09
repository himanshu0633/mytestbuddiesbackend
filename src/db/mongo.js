import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();  // Load environment variables from .env

export default async function connectMongo() {
  const uri = process.env.MONGO_URI;  // Use MONGO_URI from .env
  if (!uri) {
    console.error("Mongo URI is not set in the environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Mongo connection failed:', err);
    process.exit(1);
  }
}
