import mongoose from 'mongoose';

const { Schema } = mongoose;

// A single scheduled activity within a day. `reason` is the AI's one-line
// explanation for why this activity was picked ("explain this pick") and
// `weatherSensitive` marks activities that should be flagged/re-planned
// when the forecast turns bad.
const ActivitySchema = new Schema({
  start: { type: String, required: true },       // "HH:MM"
  end: { type: String, required: true },          // "HH:MM"
  activity: { type: String, required: true },
  location: { type: String, default: '' },
  estimatedCost: { type: Number, default: 0 },
  reason: { type: String, default: '' },
  weatherSensitive: { type: Boolean, default: false },
  status: { type: String, enum: ['planned', 'replaced', 'cancelled'], default: 'planned' },
  replacedReason: { type: String, default: null }, // 'weather' | 'closed' | 'other'
  notes: { type: String, default: '' }
}, { _id: true });

const DaySchema = new Schema({
  day: { type: Number, required: true },
  date: { type: Date, default: null },
  weatherSummary: {
    condition: { type: String, default: null },
    tempMaxC: { type: Number, default: null },
    tempMinC: { type: Number, default: null },
    precipitationProbability: { type: Number, default: null },
    fetchedAt: { type: Date, default: null }
  },
  activities: { type: [ActivitySchema], default: [] }
}, { _id: false });

const TripSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  destination: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  days: { type: Number, required: true, min: 1, max: 30 },
  startDate: { type: Date, default: null },
  currency: { type: String, default: 'USD' },
  budget: { type: Number, default: null },              // null = no budget constraint
  totalEstimatedCost: { type: Number, default: 0 },
  overBudget: { type: Boolean, default: false 
  },
  itinerary: { type: [DaySchema], default: [] },
  status: { type: String, enum: ['draft', 'confirmed', 'archived'], default: 'draft' }
}, { timestamps: true });

TripSchema.methods.recomputeTotals = function recomputeTotals() {
  let total = 0;
  for (const day of this.itinerary) {
    for (const act of day.activities) {
      if (act.status !== 'cancelled') total += Number(act.estimatedCost) || 0;
    }
  }
  this.totalEstimatedCost = Math.round(total * 100) / 100;
  this.overBudget = typeof this.budget === 'number' && this.budget > 0
    ? this.totalEstimatedCost > this.budget
    : false;
  return this.totalEstimatedCost;
};

export default mongoose.model('Trip', TripSchema);
