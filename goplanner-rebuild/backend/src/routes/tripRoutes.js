import express from 'express';
import auth from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import {
  createTrip, getTrips, getTripById, updateTrip, deleteTrip,
  replanTripActivity, refreshTripWeather
} from '../controllers/tripController.js';
import { exportTripICS, exportTripPDF } from '../controllers/exportController.js';

const router = express.Router();

router.use(auth);

router.route('/')
  .get(getTrips)
  .post(aiLimiter, createTrip);

router.route('/:id')
  .get(getTripById)
  .put(updateTrip)
  .delete(deleteTrip);

router.post('/:id/days/:day/activities/:index/replan', aiLimiter, replanTripActivity);
router.post('/:id/weather/refresh', refreshTripWeather);

router.get('/:id/export/ics', exportTripICS);
router.get('/:id/export/pdf', exportTripPDF);

export default router;
