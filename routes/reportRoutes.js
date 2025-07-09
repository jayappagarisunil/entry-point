// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/daily-detailed', reportController.getDailyDetailedReport);
router.get('/daily-summary', reportController.getDailySummaryReport);

// ✅ Add these two new routes for monthly reports
router.get('/monthly-detailed', reportController.getMonthlyDetailedReport);
router.get('/monthly-summary', reportController.getMonthlySummaryReport);

module.exports = router;
