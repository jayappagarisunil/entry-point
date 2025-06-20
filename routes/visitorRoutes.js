// // routes/visitorRoutes.js
// const express = require('express');
// const router = express.Router();
// const visitorController = require('../controllers/visitorController');

// router.post('/visitors', visitorController.createVisitor); // POST /api/visitors

// module.exports = router;


// routes/visitorRoutes.js
const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const multer = require('multer');

// Use memory storage so we can upload the buffer to Supabase
const upload = multer({ storage: multer.memoryStorage() });

// This route now handles form-data and file upload under the field name 'photo_file'
router.post('/visitors', upload.single('photo_file'), visitorController.createVisitor);

// ✅ Route for Security users
router.post('/visitors/security', upload.single('photo_file'), visitorController.createVisitorBySecurity);


module.exports = router;
