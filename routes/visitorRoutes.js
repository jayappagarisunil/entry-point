// routes/visitorRoutes.js
const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');

router.post('/visitors', visitorController.createVisitor); // POST /api/visitors

module.exports = router;
