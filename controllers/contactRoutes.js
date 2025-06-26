const express = require('express')
const { handleContactRequest } = require('../controllers/contactController.js')

const router = express.Router()

router.post('/contact', handleContactRequest)

module.exports = router
