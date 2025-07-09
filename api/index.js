// // /api/index.js
// const express = require('express');
// const cors = require('cors');
// const serverless = require('serverless-http'); // ✅ needed for Vercel
// require('dotenv').config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Routes
// const visitorRoutes = require('../routes/visitorRoutes');
// const scannerRoutes = require('../routes/scannerRoutes');
// const employeeRoutes = require('../routes/employeeRoutes');
// const logsRoutes = require('../routes/logsRoute');
// const DashboardAnalyticsRoute = require('../routes/DashboardAnalyticsRoutes');
// const userProfileRoutes = require('../routes/UserProfileRoutes');


// app.use('/api', visitorRoutes);
// app.use('/api', scannerRoutes);
// app.use('/api', employeeRoutes);
// app.use('/api', logsRoutes);
// app.use('/api', DashboardAnalyticsRoute);
// app.use('/api', userProfileRoutes);

// // ⚠️ DO NOT call app.listen() in Vercel
// // Instead export the app as a serverless function
// // Root route
// app.get('/', (req, res) => {
//   res.json({ message: 'API is running 🚀' });
// });

// module.exports = app;
// module.exports.handler = serverless(app);


// /api/index.js
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve static frontend (if needed) from 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// ✅ Routes
const tenantRoutes = require('../routes/tenantRoutes');
const visitorRoutes = require('../routes/visitorRoutes');
const scannerRoutes = require('../routes/scannerRoutes');
const employeeRoutes = require('../routes/employeeRoutes');
const logsRoutes = require('../routes/logsRoute');
const chatRoutes = require('../routes/chatRoute');
const DashboardAnalyticsRoute = require('../routes/DashboardAnalyticsRoutes');
const userProfileRoutes = require('../routes/UserProfileRoutes');
const alertRoutes = require('../routes/alertRoutes');
const userRoutes = require('../routes/userRoutes');
const platformRoutes = require('../routes/platformRoutes');
// const mailRoutes = require('../routes/mailRoutes');
const contactRoutes = require('../routes/contactRoutes');
const reportRoutes = require('../routes/reportRoutes');



// ✅ Use routes
app.use('/api', tenantRoutes);
app.use('/api', visitorRoutes);
app.use('/api', scannerRoutes);
app.use('/api', employeeRoutes);
app.use('/api', logsRoutes);
app.use('/api', chatRoutes);
app.use('/api', DashboardAnalyticsRoute);
app.use('/api', userProfileRoutes);
app.use('/api', alertRoutes);
app.use('/api', userRoutes);
app.use('/api/platform', platformRoutes);
// app.use('/api', mailRoutes);
app.use('/api', contactRoutes);
app.use('/api/reports', reportRoutes);

// ✅ Root route
app.get('/', (req, res) => {
  res.json({ message: 'API is running 🚀 (Vercel)' });
});

// ✅ Export as serverless function for Vercel
module.exports = app;
module.exports.handler = serverless(app);
