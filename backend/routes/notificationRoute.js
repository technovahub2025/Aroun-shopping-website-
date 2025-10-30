const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Subscribe to notifications
router.post('/subscribe', notificationController.subscribeToNotifications);

// Unsubscribe from notifications
router.post('/unsubscribe', notificationController.unsubscribeFromNotifications);

module.exports = router;