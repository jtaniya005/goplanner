import Trip from '../models/Trip.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateItinerary, reviseItineraryForBudget, replanActivity } from '../lib/aiClient.js';
import { getDailyForecast } from '../lib/weatherClient.js';

function daysArrayToDocs(daysFromAI, startDate) {
  return daysFromAI.map((d, idx) => {
    const date = startDate ? new Date(startDate) : null;
    if (date) date.setDate(date.getDate() + idx);
    return {
      day: d.day ?? idx + 1,
      date,
      activities: (d.activities || []).map((a) => ({
        start: a.start,
        end: a.end,
        activity: a.activity,
        location: a.location || '',
        estimatedCost: Number(a.estimatedCost) || 0,
        reason: a.reason || '',
        weatherSensitive: Boolean(a.weatherSensitive),
        status: 'planned'
      }))
    };
  });
}

function sumCost(daysFromAI) {
  return daysFromAI.reduce((sum, d) => sum + (d.activities || []).reduce((s, a) => s + (Number(a.estimatedCost) || 0), 0), 0);
}

// CREATE — generates an AI itinerary, and if a budget was set and the plan
// comes in over budget, automatically asks the AI for one cheaper revision
// before saving (this is the "budget-aware re-planning" feature).
export const createTrip = asyncHandler(async (req, res) => {
  const { destination, days, description, budget, currency, startDate } = req.body;

  if (!destination) throw new AppError('Destination is required.', 400);
  const numDays = Number(days);
  if (!Number.isFinite(numDays) || numDays < 1 || numDays > 30) {
    throw new AppError('days must be a number between 1 and 30.', 400);
  }
  const numBudget = budget != null && budget !== '' ? Number(budget) : null;
  if (numBudget != null && (!Number.isFinite(numBudget) || numBudget <= 0)) {
    throw new AppError('budget must be a positive number if provided.', 400);
  }
  const tripCurrency = currency || 'USD';

  let aiDays = await generateItinerary({
    destination, days: numDays, budget: numBudget, currency: tripCurrency, description
  });

  let total = sumCost(aiDays);
  let revised = false;
  if (numBudget && total > numBudget * 1.1) {
    try {
      const revisedDays = await reviseItineraryForBudget({
        destination, days: numDays, budget: numBudget, currency: tripCurrency,
        overBy: Math.round((total - numBudget) * 100) / 100
      });
      aiDays = revisedDays;
      total = sumCost(aiDays);
      revised = true;
    } catch {
      // If the revision call fails, keep the original plan and let overBudget flag it.
    }
  }

  const trip = new Trip({
    user: req.user.id,
    destination,
    description: description || '',
    days: numDays,
    startDate: startDate || null,
    currency: tripCurrency,
    budget: numBudget,
    itinerary: daysArrayToDocs(aiDays, startDate)
  });
  trip.recomputeTotals();
  await trip.save();

  res.status(201).json({ success: true, data: trip, meta: { budgetRevisionAttempted: revised } });
});

export const getTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: trips });
});

async function loadOwnedTrip(req) {
  const trip = await Trip.findOne({ _id: req.params.id, user: req.user.id });
  if (!trip) throw new AppError('Trip not found.', 404);
  return trip;
}

export const getTripById = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req);
  res.json({ success: true, data: trip });
});

export const updateTrip = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req);
  const allowed = ['destination', 'description', 'startDate', 'budget', 'currency', 'status'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) trip[key] = req.body[key];
  }
  trip.recomputeTotals();
  await trip.save();
  res.json({ success: true, data: trip });
});

export const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!trip) throw new AppError('Trip not found.', 404);
  res.json({ success: true, message: 'Trip deleted.' });
});

// Smart re-plan: swap a single activity because of bad weather, a closed
// venue, or the traveler just wanting something different — without
// regenerating the whole day.
export const replanTripActivity = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req);
  const dayNum = Number(req.params.day);
  const actIndex = Number(req.params.index);
  const reason = ['weather', 'closed', 'other'].includes(req.body?.reason) ? req.body.reason : 'other';

  const day = trip.itinerary.find((d) => d.day === dayNum);
  if (!day) throw new AppError('Day not found on this trip.', 404);
  const activity = day.activities[actIndex];
  if (!activity) throw new AppError('Activity not found in that day.', 404);

  const spentExcludingThis = trip.itinerary
    .flatMap((d) => d.activities)
    .filter((a) => a !== activity && a.status !== 'cancelled')
    .reduce((s, a) => s + (a.estimatedCost || 0), 0);
  const budgetRemaining = typeof trip.budget === 'number' ? Math.max(0, trip.budget - spentExcludingThis) : null;

  const replacement = await replanActivity({
    destination: trip.destination,
    day: dayNum,
    timeWindow: { start: activity.start, end: activity.end },
    currentActivity: activity.activity,
    reason,
    budgetRemaining,
    currency: trip.currency
  });

  activity.activity = replacement.activity;
  activity.location = replacement.location || '';
  activity.estimatedCost = Number(replacement.estimatedCost) || 0;
  activity.reason = replacement.reason || '';
  activity.weatherSensitive = Boolean(replacement.weatherSensitive);
  activity.status = 'replaced';
  activity.replacedReason = reason;

  trip.recomputeTotals();
  await trip.save();

  res.json({ success: true, data: trip });
});

// Fetches a forecast for the trip's dates/destination, stores a per-day
// summary on the trip, and flags which weather-sensitive activities are at
// risk so the client can prompt the user to re-plan them.
export const refreshTripWeather = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req);
  if (!trip.startDate) throw new AppError('This trip has no start date set — cannot fetch a forecast.', 400);

  const { place, forecast } = await getDailyForecast(trip.destination, trip.startDate, trip.days);
  if (!place) throw new AppError(`Could not resolve location "${trip.destination}" for weather lookup.`, 404);

  const atRisk = [];
  for (const f of forecast) {
    const day = trip.itinerary.find((d) => d.day === f.day);
    if (!day) continue;
    if (f.available) {
      day.weatherSummary = {
        condition: f.condition,
        tempMaxC: f.tempMaxC,
        tempMinC: f.tempMinC,
        precipitationProbability: f.precipitationProbability,
        fetchedAt: new Date()
      };
      if (f.isBadWeather) {
        day.activities.forEach((act, idx) => {
          if (act.weatherSensitive && act.status === 'planned') {
            atRisk.push({ day: f.day, index: idx, activity: act.activity, condition: f.condition });
          }
        });
      }
    }
  }

  await trip.save();
  res.json({ success: true, data: trip, atRisk, resolvedLocation: place.resolvedName });
});
