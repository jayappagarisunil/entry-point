// routes/tenantRoutes.js
const express = require('express');
const router = express.Router();
const { createTenantWithAdmin,getAllTenants,
  activateTenant,
  deactivateTenant } = require('../controllers/tenantController');

router.post('/platform/tenants/create', createTenantWithAdmin);
router.get('/platform/tenants', getAllTenants);
router.post('/platform/tenant/:id/activate', activateTenant);
router.post('/platform/tenant/:id/deactivate', deactivateTenant);

module.exports = router;
