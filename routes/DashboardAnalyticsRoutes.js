const express = require('express');
const router = express.Router();
const controller = require('../controllers/DashboardAnalyticsController');

router.get('/summary', controller.getSummary);
router.get('/upcoming-visitors', controller.getUpcomingVisitors);
router.get('/monthly-visitors', controller.getMonthlyVisitors);


// ✅ New routes for security dashboard
router.get('/security-summary', controller.getTodayEntryStats); // Entered/Exited today
router.get('/security-recent', controller.getRecentEntries);   // Recently entered
router.get('/security-monthly', controller.getMonthlyBySecurity); // Monthly chart by security

module.exports = router;
