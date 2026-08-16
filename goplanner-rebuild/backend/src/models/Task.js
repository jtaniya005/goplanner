import mongoose from 'mongoose';

const { Schema } = mongoose;

const TaskSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  start: { type: String, required: true },       // "HH:MM"
  end: { type: String, required: true },         // "HH:MM"
  title: { type: String, required: true },
  category: { type: String, enum: ['meeting', 'appointment', 'personal', 'travel', 'other'], default: 'other' },
  location: { type: String, default: '' },
  notes: { type: String, default: '' },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Task', TaskSchema);
