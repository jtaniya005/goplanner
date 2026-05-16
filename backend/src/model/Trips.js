// src/models/Trip.js
import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  dateDisplay: { type: String },
  places: [{ type: String }],         // list of place names
  durationHours: { type: Number },    // e.g., 6
  costEstimate: { type: Number },     // optional
  itinerary: [
    {
      start: { type: Date },
      end: { type: Date },
      activity: { type: String },
      location: { type: String },
      notes: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const Trip = mongoose.model('Trip', TripSchema);
export default Trip;
