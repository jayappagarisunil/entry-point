const express = require('express');
const router = express.Router();
const { getLogsBySecurityId } = require('../controllers/logsController');
const { getLogsByCreator } = require('../controllers/logsController');
const { getLogsByWhomToMeet } = require('../controllers/logsController');

router.get('/logs/by-security', getLogsBySecurityId);
router.get('/logs/creator', getLogsByCreator);
router.get('/logs/whomtomeet', getLogsByWhomToMeet);

module.exports = router;
