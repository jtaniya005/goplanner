import express from 'express';
import { login, register } from '../controllers/authController.js';

const router = express.Router();

// Register route
router.post('/register', register);

// Login route with JWT token generation
router.post('/login', login);

export default router;
