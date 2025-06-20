const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat-related routes
router.get('/chat/list', chatController.getRecentChats);
router.post('/chat/send', chatController.sendMessage);
router.get('/chat/history', chatController.getMessages);
router.put('/chat/seen', chatController.markMessagesAsSeen);

// User-related route
router.get('/users/list', chatController.getAllUsers); // shows all users except the logged-in user

module.exports = router;
