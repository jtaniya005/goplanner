import {Notification} from "../../../src/model/Notification.js";


// create notification
export const createNotification = async (req, res) => {
  try {
    const { title, message, type, meta } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const notification = await Notification.create({ userId, title, message, type, meta });

    res.status(201).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get all notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// mark as read
export const markAsRead = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    // Only allow the owner to mark their notification as read
    const updated = await Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Notification not found or not owned by user' });

    res.json({ success: true, message: 'Marked as read', notification: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
