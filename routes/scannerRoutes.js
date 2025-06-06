const express = require('express');
const router = express.Router();
const scannerController = require('../controllers/scannerController');

// POST /api/scan
router.post('/scan', scannerController.verifyQRToken);

module.exports = router;
