import express from 'express';
import auth from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { getPackingList, convertCurrency } from '../controllers/toolsController.js';

const router = express.Router();

router.use(auth);

router.post('/packing-list', aiLimiter, getPackingList);
router.get('/convert-currency', convertCurrency);

export default router;
