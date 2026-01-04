// routes/user.routes.js (API Routes)

const express = require('express');
const router = express.Router();
// Import the controller functions
const userController = require('../controllers/user.controller'); 
const { authorizeRoles } = require('../middleware/authJwt');

// The API base route is likely mounted at /api/users in server.js.

// POST /api/users - Create a new user (handles the 'New User' form submission)
router.post('/', [authorizeRoles(['admin'])], userController.create);

// PUT /api/users/:id - Update a user (handles the 'Edit User' form submission)
// Note: We use req.params.id, but the controller uses req.params.id as the userId
router.put('/:id', [authorizeRoles(['admin'])], userController.update);

// DELETE /api/users/:id - Delete a user (handles the 'Delete' button submission)
router.delete('/:id', [authorizeRoles(['admin'])], userController.delete);

// Example route registration
router.get('/admin/orders', userController.viewAdminOrders);
router.post('/admin/orders/:orderId/status', userController.updateOrderStatus);
// NOTE: We don't need the GET routes here as the view routes handle fetching data for EJS rendering.

module.exports = router;