 import mongoose from 'mongoose';

const DayItemSchema = new mongoose.Schema({
  startTime: { type: String },
  endTime: { type: String },
  activity: { type: String, required: true },
  location: { type: String },
  notes: { type: String }
});

const DayPlannerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  items: [DayItemSchema],
  meta: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

const DayPlanner = mongoose.model('DayPlanner', DayPlannerSchema);
export default DayPlanner;
