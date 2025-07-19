const express = require('express');
const router = express.Router();
const {
  registerUser,
  updateEmployee,
  deleteEmployee,
  getEmployeesByTenant,
  getEmployeeById,
  sendPasswordReset
} = require('../controllers/userController');

router.post('/registerUser', registerUser);
router.patch('/update/:id', updateEmployee);
router.delete('/delete/:id', deleteEmployee);
router.get('/list', getEmployeesByTenant); // /api/employees/list?tenant_id=xxx
router.get('/get/:id', getEmployeeById);
 

module.exports = router;
