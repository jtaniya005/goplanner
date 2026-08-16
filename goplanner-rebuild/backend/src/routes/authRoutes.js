import express from 'express';
import { register, login, me } from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', auth, me);

export default router;
