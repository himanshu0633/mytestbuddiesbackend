
import mongoose from 'mongoose';

const PerviousSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, 
  description: { type: String }, 
  for: { type: String, enum: ['student', 'general'], },
});

const Pervious = mongoose.model('Pervious', PerviousSchema);
export default Pervious;