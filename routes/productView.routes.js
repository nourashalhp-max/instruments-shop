const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/authJwt');
const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');
const db = require('../models'); // Moved to top for cleanliness

// ==========================================================
// PRODUCT VIEW ROUTES (EJS Rendering)
// ==========================================================

// Search & Filter List
router.get('/', productController.listProducts);

// GET /products/new
router.get('/new', isAuthenticated, authorizeRoles(['admin']), async (req, res) => {
    try {
        const categories = await db.Category.findAll({ order: [['name', 'ASC']] });
        res.render('products/form', { 
            title: 'Create New Product',
            product: null,
            categories: categories,
            messages: req.flash(),
            user: req.user || null,
            req: req
        });
    } catch (error) {
        res.redirect('/products');
    }
});

// GET /products/:id/edit
router.get('/:id/edit', isAuthenticated, authorizeRoles(['admin']), async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id);
        const categories = await db.Category.findAll({ order: [['name', 'ASC']] });

        if (!product) return res.redirect('/products');

        res.render('products/form', {
            title: `Edit Product: ${product.name}`,
            product: product,
            categories: categories,
            messages: req.flash(),
            user: req.user || null,
            req: req
        });
    } catch (error) {
        res.redirect('/products');
    }
});

// GET /products/:id - Single product detail
router.get('/:id', async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id, {
            include: [
                { model: db.Category, as: 'category' },
                { 
                    model: db.Review, 
                    as: 'reviews',
                    include: [{ model: db.User, as: 'user', attributes: ['username'] }] 
                }
            ],
            order: [[ { model: db.Review, as: 'reviews' }, 'createdAt', 'DESC' ]]
        });

        if (!product) return res.redirect('/products');

        res.render('products/detail', { 
            title: product.name,
            product: product,
            user: req.user || null,
            req: req,
            messages: req.flash()
        });
    } catch (error) {
        res.redirect('/products');
    }
});

// Review Route
router.post('/:productId/review', isAuthenticated, reviewController.createReview);

module.exports = router;