import express from "express";
import auth from '../src/middleware/auth.js';
import { createNotification, getUserNotifications, markAsRead } from "../controllers/notificationController.js";

const router = express.Router();

// Create notification (authenticated) — uses `req.user.id` if `userId` not provided
router.post("/", auth, createNotification);

// Get notifications for a user (authenticated) — users may only fetch their own notifications
router.get("/:userId", auth, getUserNotifications);

// Mark as read (authenticated)
router.put("/read/:id", auth, markAsRead);

export default router;

