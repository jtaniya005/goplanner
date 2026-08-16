import express from 'express';
import auth from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import {
  createTrip, getTrips, getTripById, updateTrip, deleteTrip,
  replanTripActivity, refreshTripWeather,
  createManualTrip, addActivity, editActivity, deleteActivity, standaloneWeatherLookup
} from '../controllers/tripController.js';
import { exportTripICS, exportTripPDF } from '../controllers/exportController.js';

const router = express.Router();

router.use(auth);

// Standalone weather lookup (must be placed before /:id)
router.get('/weather/lookup', standaloneWeatherLookup);

// Manual trip creation (must be placed before /:id)
router.post('/manual', createManualTrip);

router.route('/')
  .get(getTrips)
  .post(aiLimiter, createTrip);

router.route('/:id')
  .get(getTripById)
  .put(updateTrip)
  .delete(deleteTrip);

// Manual activity management
router.post('/:id/days/:day/activities', addActivity);
router.put('/:id/days/:day/activities/:index', editActivity);
router.delete('/:id/days/:day/activities/:index', deleteActivity);

router.post('/:id/days/:day/activities/:index/replan', aiLimiter, replanTripActivity);
router.post('/:id/weather/refresh', refreshTripWeather);

router.get('/:id/export/ics', exportTripICS);
router.get('/:id/export/pdf', exportTripPDF);

export default router;
