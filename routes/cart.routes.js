// routes/cart.routes.js (Exclusively for Cart API)

const express = require('express');
const router = express.Router();

const { verifyTokenForApi } = require('../middleware/authJwt');
const cartController = require('../controllers/cart.controller'); // Renamed import to avoid confusion

// --- Cart API Routes ---

// GET /api/cart - Get user's cart content (JSON)
router.get('/', [verifyTokenForApi], cartController.getCart);
// POST /api/cart/add - Add item to cart
router.post('/add', [verifyTokenForApi], cartController.addToCart);
// PUT /api/cart/items/:productId - Update item quantity in cart
router.put('/items/:productId', [verifyTokenForApi], cartController.updateCartItemQuantity);
// DELETE /api/cart/items/:productId - Remove item from cart
router.delete('/items/:productId', [verifyTokenForApi], cartController.removeCartItem);
// POST /api/cart/clear - Clear all items from cart
router.post('/clear', [verifyTokenForApi], cartController.clearCart);

module.exports = router;