// routes/product.routes.js (NOW ONLY API ROUTES)
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { isAuthenticated, authorizeRoles } = require('../middleware/authJwt');
const upload = require('../middleware/multer'); // Keep this for image upload middleware


// --- API ENDPOINTS (These handle the actual data manipulation) ---
// These paths are relative to where this router is mounted in server.js (which will be /api/products)
router.post('/', [isAuthenticated, authorizeRoles(['admin']), upload.single('productImage')], productController.createProduct);
router.put('/:id', [isAuthenticated, authorizeRoles(['admin']), upload.single('productImage')], productController.updateProduct);
router.delete('/:id', [isAuthenticated, authorizeRoles(['admin'])], productController.deleteProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

module.exports = router;