// src/routes/trips.js
import { createTrip, getTrips, getTripById, updateTrip, deleteTrip } from '../controllers/tripController.js';
import express from 'express';
import auth from '../../../src/middleware/auth.js';
const router = express.Router();

// Protect all trip routes — client must send `Authorization: Bearer <token>`
router.use(auth);

router.route('/')
  .get(getTrips)
  .post(createTrip);

router.route('/:id')
  .get(getTripById)
  .put(updateTrip)
  .delete(deleteTrip);

export default router;
