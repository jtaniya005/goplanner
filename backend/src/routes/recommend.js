import express from 'express';
import { recommend } from '../controllers/recommendController.js';
const router = express.Router();

// Public recommend route — returns suggested places and itinerary without creating a trip
router.post('/', recommend);

export default router;
