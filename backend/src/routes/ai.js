import express from 'express';
import { chatProxy } from '../../controllers/aiController.js';

const router = express.Router();

// POST /api/ai/chat
router.post('/chat', chatProxy);

export default router;
