// models/Field.js
import e from 'express';
import mongoose from 'mongoose';

const FieldSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
  description: { type: String }, 
  for: { type: String, enum: ['student', 'general'], },
});

const Field = mongoose.model('Field', FieldSchema);
export default Field;
  