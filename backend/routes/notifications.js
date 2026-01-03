const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get Notifications (Protected)
router.get('/', auth, async (req, res) => {
    const username = req.user.username; // From Token
    console.log(`[Notifications] Fetching for user: ${username}`);
    try {
        const notifications = await Notification.find({ recipientUsername: username }).sort({ createdAt: -1 }).limit(50);
        console.log(`[Notifications] Found ${notifications.length} notifications for ${username}`);

        const notificationIds = notifications.filter(n => !n.isRead).map(n => n._id);
        if (notificationIds.length > 0) {
            try {
                await Notification.updateMany(
                    { _id: { $in: notificationIds } },
                    { $set: { isRead: true } }
                );
            } catch (updateError) { console.error(`Error marking notifications as read:`, updateError); }
        }
        res.status(200).json(notifications);
    } catch (error) {
        console.error(`Error fetching notifications for user ${username}:`, error);
        res.status(500).json({ message: 'Server error fetching notifications', error: error.message });
    }
});

// Get Unread Count (Protected)
router.get('/unread-count', auth, async (req, res) => {
    const username = req.user.username; // From Token
    try {
        const unreadCount = await Notification.countDocuments({ recipientUsername: username, isRead: false });
        res.status(200).json({ unreadCount: unreadCount });
    } catch (error) {
        console.error(`Error fetching unread notification count for user ${username}:`, error);
        res.status(500).json({ message: 'Server error fetching notification count', error: error.message });
    }
});

module.exports = router;
