const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mailController');

router.post('/send-password-changed-email', mailController.sendPasswordChangedEmail);

module.exports = router;
