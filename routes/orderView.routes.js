// routes/orderView.routes.js (View Routes for Orders)

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { isAuthenticated } = require('../middleware/authJwt');

// GET /orders - Renders the 'My Orders' list page (EJS)
router.get('/', isAuthenticated, orderController.viewOrdersPage);

// GET /orders/confirmation/:orderId - Renders the order confirmation page
router.get('/confirmation/:orderId', isAuthenticated, orderController.showConfirmation);

module.exports = router;