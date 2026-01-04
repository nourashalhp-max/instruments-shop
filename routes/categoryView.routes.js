// routes/categoryView.routes.js
const express = require('express');
const router = express.Router();
// const categoryController = require('../controllers/category.controller'); // Removed since we are using inline logic
const { isAuthenticated, authorizeRoles } = require('../middleware/authJwt');
const db = require('../models');

// GET /categories - Display a list of all categories (EJS View)
// NOTE: Removed the duplicate route definition. This one handles the EJS view.
router.get('/', isAuthenticated, authorizeRoles(['admin']), async (req, res) => {
    try {
        const categories = await db.Category.findAll({
            order: [['name', 'ASC']]
        });
        res.render('categories/list', {
            title: 'Manage Categories',
            categories: categories,
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            },
            user: req.user || null,
            req: req // Pass req for header.ejs to use
        });
    } catch (error) {
        console.error("Error loading categories list page:", error);
        req.flash('error', 'Failed to load categories. Please try again.');
        res.redirect('/dashboard'); // Redirect to dashboard on error
    }
});

// GET /categories/new - Display the form for creating a new category (EJS View)
router.get('/new', isAuthenticated, authorizeRoles(['admin']), (req, res) => {
    res.render('categories/form', {
        title: 'Create New Category',
        category: null, // For new category, category object is null
        messages: {
            error: req.flash('error'),
            success: req.flash('success')
        },
        user: req.user || null,
        req: req
    });
});

// GET /categories/:id/edit - Display the form for editing an existing category (EJS View)
router.get('/:id/edit', isAuthenticated, authorizeRoles(['admin']), async (req, res) => {
    try {
        const category = await db.Category.findByPk(req.params.id);
        if (!category) {
            req.flash('error', 'Category not found for editing.');
            return res.redirect('/categories');
        }
        res.render('categories/form', {
            title: `Edit Category: ${category.name}`,
            category: category,
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            },
            user: req.user || null,
            req: req
        });
    } catch (error) {
        console.error("Error loading edit category form:", error);
        req.flash('error', 'Failed to load category for editing. Please try again.');
        res.redirect('/categories');
    }
});

module.exports = router;