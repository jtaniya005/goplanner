import Trip from '../models/Trip.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildTripICS } from '../lib/icsBuilder.js';
import { streamTripPDF } from '../lib/pdfBuilder.js';

async function loadOwnedTrip(req) {
  const trip = await Trip.findOne({ _id: req.params.id, user: req.user.id });
  if (!trip) throw new AppError('Trip not found.', 404);
  return trip;
}

export const exportTripICS = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req);
  const ics = buildTripICS(trip);
  const filename = `${trip.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-itinerary.ics`;
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(ics);
});

export const exportTripPDF = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req);
  const filename = `${trip.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-itinerary.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  streamTripPDF(trip, res);
});
