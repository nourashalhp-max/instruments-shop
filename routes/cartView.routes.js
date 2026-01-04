// routes/cartView.routes.js (View Routes for Cart)

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { isAuthenticated } = require('../middleware/authJwt');

// GET /cart - Renders the cart page (EJS)
// Requires authentication to ensure we get the correct user's cart
router.get('/', isAuthenticated, cartController.viewCartPage);

module.exports = router;