// routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// GET /api/chats/list/:user_id/:tenant_id
router.get('/list/:user_id/:tenant_id', chatController.getChatList);

// Get chat history with user details
router.get('/history/:userId/:otherUserId/:tenantId', chatController.getChatHistory);

// // Send a new message
router.post('/chat/send', chatController.sendMessage); 

module.exports = router;
