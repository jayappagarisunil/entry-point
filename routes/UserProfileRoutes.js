// // D:\VM\Backend\entrypoint-backend\routes\UserProfileRoutes.js

// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const upload = multer(); // for parsing multipart/form-data

// const controller = require('../controllers/UserProfileController');

// router.get('/profile/:id', controller.getUserProfile);
// router.put('/profile/:id', upload.single('photo_file'), controller.updateUserProfile);

// module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');

// ✅ Use memory storage so file data is accessible as a buffer
const upload = multer({ storage: multer.memoryStorage() });

const controller = require('../controllers/UserProfileController');

// Get user profile
router.get('/profile/:id', controller.getUserProfile);

// Update user profile with optional photo upload
router.put('/profile/:id', upload.single('photo_file'), controller.updateUserProfile);

module.exports = router;
