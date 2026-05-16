// Use MongoDB via Mongoose for persistent trips
import Trip from '../model/Trips.js';
import { generateText } from '../lib/aiClient.js';
import { getPopularPlaces, getPopularPlacesStrict } from '../lib/placesClient.js';

// Helper to format a JS Date into MM/DD/YYYY h:mm AM/PM
const formatToAMPM = (input) => {
  let d;
  if (!input) d = new Date();
  else {
    d = new Date(input);
    if (isNaN(d.getTime())) d = new Date(String(input).replace(/-/g, '/'));
  }
  if (isNaN(d.getTime())) return String(input || '');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const mm = minutes < 10 ? '0' + minutes : minutes;
  return `${month}/${day}/${year} ${hours}:${mm} ${ampm}`;
};

// Estimate trip details using AI (OpenAI) when available, otherwise use heuristics.
// Accepts optional overrides via `opts` { startTime, durationHours }
export const estimateTripDetails = async (destination, description, opts = {}) => {
  // Basic heuristic fallback
  const heuristic = async() => {
    const lower = (description || '').toLowerCase();
    // prefer to fetch popular places for the destination
    const places = [];
    try {
      // Prefer a strict/popular list so we don't end up with only the city name
      const fetched = await getPopularPlacesStrict(destination, 6);
      if (Array.isArray(fetched) && fetched.length) {
        fetched.forEach(p => places.push(p));
      }
    } catch (e) {
      // ignore and fallback to description parsing below
    }
    if (!places.length) {
      const fromDesc = description && description.includes(',')
        ? description.split(',').map(p => p.trim()).filter(Boolean).slice(0, 5)
        : [destination];
      fromDesc.forEach(p => places.push(p));
    }

    // crude duration estimation
    let durationHours = 4;
    if (/day|days|week|weeks|overnight|overnight stay/.test(lower)) durationHours = 24;
    if (/week|weeks/.test(lower)) durationHours = 24 * 7;
    if (/half day|half-day|few hours/.test(lower)) durationHours = 4;
    if (/long trip|road trip|cross-country|international/.test(lower)) durationHours = 24 * 3;

    // cost estimate ($) as durationHours * rate (simple heuristic)
    const rate = /luxury|expensive|premium/.test(lower) ? 150 : /budget|cheap/.test(lower) ? 25 : 50;
    const costEstimate = Math.round(durationHours * rate);

    // date: respect opts.startTime if provided, otherwise infer relative
    const now = new Date();
    let date = opts.startTime ? new Date(opts.startTime) : null;
    if (!date || isNaN(date.getTime())) {
      if (/tomorrow/.test(lower)) {
        date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
      } else if (/today/.test(lower)) {
        date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
      } else {
        date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
      }
    }

    // Compose a simple itinerary by dividing duration across places
    const dur = opts.durationHours ?? durationHours;
    const slots = Math.max(1, places.length);
    const perPlaceHours = Math.max(0.5, Math.round((dur / slots) * 2) / 2); // nearest 0.5
    const itinerary = [];
    let cursor = new Date(date);
    for (let i = 0; i < places.length; i++) {
      const start = new Date(cursor);
      const end = new Date(start.getTime() + perPlaceHours * 60 * 60 * 1000);
      itinerary.push({ start, end, activity: `Visit ${places[i]}`, location: places[i], notes: '' });
      cursor = new Date(end);
    }

    return { date, durationHours: dur, costEstimate, places, itinerary };
  };

  // Try AI-based estimate using provider-agnostic generateText. If anything fails, fall back to heuristic
  try {
    const prompt = `You are an assistant that returns a JSON object describing a trip plan. Respond with only valid JSON. Keys: date (ISO string), durationHours (number), costEstimate (number USD), places (array of strings), itinerary (array of objects with start (ISO), end (ISO), activity, location, notes).\n\nDestination: ${destination}\nDescription: ${description || ''}\nOverrides: ${JSON.stringify(opts)}\n\nCreate a reasonable plan and itinerary based on the information.`;

    const text = await generateText(prompt, { model: 'gpt-3.5-turbo', temperature: 0.2, max_tokens: 800, system: 'You are a JSON generator for trip estimates and itineraries.' });
    if (!text || typeof text !== 'string') return heuristic();

    const jsonTextMatch = String(text).match(/\{[\s\S]*\}/);
    const jsonText = jsonTextMatch ? jsonTextMatch[0] : String(text);
    const parsed = JSON.parse(jsonText);

    const date = parsed.date ? new Date(parsed.date) : null;
    const durationHours = parsed.durationHours ? Number(parsed.durationHours) : null;
    const costEstimate = parsed.costEstimate ? Number(parsed.costEstimate) : null;
    const places = Array.isArray(parsed.places) ? parsed.places : (parsed.places ? [parsed.places] : [destination]);
    const itinerary = Array.isArray(parsed.itinerary) ? parsed.itinerary.map(item => ({
      start: item.start ? new Date(item.start) : null,
      end: item.end ? new Date(item.end) : null,
      activity: item.activity || '',
      location: item.location || '',
      notes: item.notes || ''
    })) : null;

    const base = await heuristic();
    return {
      date: date instanceof Date && !isNaN(date.getTime()) ? date : base.date,
      durationHours: Number.isFinite(durationHours) ? durationHours : base.durationHours,
      costEstimate: Number.isFinite(costEstimate) ? costEstimate : base.costEstimate,
      places,
      itinerary: itinerary || base.itinerary
    };
  } catch (err) {
    console.warn('AI estimate failed, falling back to heuristic:', err?.message || err);
    return heuristic();
  }
};

// CREATE a new trip
export const createTrip = async (req, res) => {
  try {
    const { destination, description, startTime, durationHours } = req.body;
    if (!destination) return res.status(400).json({ message: 'Destination is required' });

    // Use AI/heuristic to fill in or refine trip details
    const estimated = await estimateTripDetails(destination, description || '', { startTime, durationHours });

    const dateObj = estimated.date || new Date();
    const dateDisplay = formatToAMPM(dateObj);

    const trip = await Trip.create({
      destination,
      description: description || '',
      date: dateObj,
      dateDisplay,
      places: estimated.places || [],
      durationHours: estimated.durationHours ?? null,
      costEstimate: estimated.costEstimate ?? null,
      itinerary: estimated.itinerary || []
    });

    return res.status(201).json({ success: true, data: trip });
  } catch (err) {
    console.error('Create trip error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET all trips
export const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: trips });
  } catch (err) {
    console.error('Get trips error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET a single trip by ID
export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    return res.json({ success: true, data: trip });
  } catch (err) {
    console.error('Get trip error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE a trip by ID
export const updateTrip = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.date) {
      const dateObj = new Date(updates.date);
      updates.date = isNaN(dateObj.getTime()) ? updates.date : dateObj;
      updates.dateDisplay = formatToAMPM(updates.date);
    }
    const trip = await Trip.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    return res.json({ success: true, data: trip });
  } catch (err) {
    console.error('Update trip error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE a trip by ID
export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    return res.json({ success: true, message: 'Trip deleted' });
  } catch (err) {
    console.error('Delete trip error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
