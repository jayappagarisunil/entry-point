const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// GET all alerts for a user
router.get('/:userId', alertController.getAlertsByUser);

// GET only unread alerts
router.get('/unread/:userId', alertController.getUnreadAlertsByUser);

// POST a new alert
router.post('/', alertController.createAlert);

// // PATCH alert status (optional)
// router.patch('/:id/status', alertController.updateAlertStatus);

// PATCH mark alert as read
router.patch('/:id/read', alertController.markAlertAsRead);

// GET pending approvals for a user
router.get('/pending/:userId', alertController.getPendingApprovals);

// ✅ Add this route correctly (ensure it's a function)
router.patch('/alerts/:id/status', alertController.updateApprovalDecision);

router.get('/request_status/:security_id', alertController.getRequestStatus);



module.exports = router;
