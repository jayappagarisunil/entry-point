// /api/index.js
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http'); // ✅ needed for Vercel
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const visitorRoutes = require('../routes/visitorRoutes');
const scannerRoutes = require('../routes/scannerRoutes');
const employeeRoutes = require('../routes/employeeRoutes');

app.use('/api', visitorRoutes);
app.use('/api', scannerRoutes);
app.use('/', employeeRoutes);

// ⚠️ DO NOT call app.listen() in Vercel
// Instead export the app as a serverless function
// Root route
app.get('/', (req, res) => {
  res.json({ message: 'API is running 🚀' });
});

module.exports = app;
module.exports.handler = serverless(app);
