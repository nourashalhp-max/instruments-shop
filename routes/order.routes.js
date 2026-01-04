const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyTokenForApi, isAuthenticated } = require('../middleware/authJwt');

// API Route
router.get('/user-orders', verifyTokenForApi, orderController.listUserOrdersApi);

// Web Routes (Using isAuthenticated for EJS views)
router.get('/', isAuthenticated, orderController.viewOrdersPage);
router.post('/place-order', isAuthenticated, orderController.placeOrder);
router.get('/confirmation/:orderId', isAuthenticated, orderController.showConfirmation);

module.exports = router;