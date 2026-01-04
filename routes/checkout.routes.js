// routes/checkout.routes.js
const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout.controller');
const { isAuthenticated } = require('../middleware/authJwt'); // Using isAuthenticated for views

// GET /checkout - Display the checkout form
router.get('/', isAuthenticated, checkoutController.showCheckoutForm);
// POST /checkout/place-order - Process the order
router.post('/place-order', isAuthenticated, checkoutController.placeOrder);

module.exports = router;