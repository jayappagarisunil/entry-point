const express = require('express');
const router = express.Router();
const { superAdminLogin } = require('../controllers/platformController');

router.post('/login', superAdminLogin);

module.exports = router;
