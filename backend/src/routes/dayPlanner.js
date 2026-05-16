import express from 'express';
import { createDayPlanner, getPlannersForUser, getPlannerById, autoScheduleDayPlanner } from '../controllers/dayPlannerController.js';

const router = express.Router();

// POST /api/dayplanner/    -> create
router.post('/', createDayPlanner);

// POST /api/dayplanner/auto -> auto schedule using AI
router.post('/auto', autoScheduleDayPlanner);

// GET /api/dayplanner/user/:userId  -> list for user
router.get('/user/:userId', getPlannersForUser);

// GET /api/dayplanner/:id  -> get by id
router.get('/:id', getPlannerById);

export default router;
