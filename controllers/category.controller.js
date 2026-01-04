// controllers/category.controller.js
const { Category, Product } = require('../models');

// POST /api/categories - Create a new category
exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        // 1. Basic Validation
        if (!name || name.trim() === '') {
            req.flash('error', 'Category name cannot be empty.');
            // Assuming the form submission comes from /categories/new
            return res.redirect('/categories/new'); 
        }

        // 2. Check for existence (handling unique constraint gracefully)
        const existingCategory = await Category.findOne({ where: { name: name.trim() } });
        if (existingCategory) {
            req.flash('error', `Category "${name}" already exists.`);
            return res.redirect('/categories/new');
        }

        // 3. Create the category
        const category = await Category.create({ name: name.trim() });
        
        // 4. Success Response: Redirect to the management page (View)
        req.flash('success', `Category "${category.name}" created successfully!`);
        return res.redirect('/categories'); 

    } catch (err) {
        console.error("Error creating category:", err);

        // Handle generic database error or unexpected field error
        let errorMessage = 'Failed to create category. An unexpected error occurred.';
        if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
             // Although we checked for unique above, this catches other validation issues
            errorMessage = err.errors.map(e => e.message).join(', ');
        }
        
        req.flash('error', errorMessage);
        // Redirect back to the form on failure
        return res.redirect('/categories/new');
    }
};

// GET /api/categories - Get all categories (API endpoint)
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ include: [{ model: Product, as: 'products' }] });
        // NOTE: This remains a JSON response for API use
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /categories - View the list of categories (EJS View)
exports.viewManageCategoriesPage = async (req, res) => {
    try {
        // 1. Fetch all categories needed for the view
        const categories = await Category.findAll({
            order: [['name', 'ASC']]
        });

        // 2. Render the admin view
        res.render('categories/list', { 
            title: 'Manage Categories',
            categories: categories,
            // CRITICAL: Pass req and user to satisfy layout.ejs
            user: req.user || null, 
            req: req,
            messages: req.flash()
        });
    } catch (err) {
        console.error("Error loading category management page:", err);
        // Fallback render to prevent a crash
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Failed to load category management page.',
            user: req.user || null,
            req: req 
        });
    }
};

// GET /categories/new - View the new category form (EJS View)
exports.viewNewCategoryPage = async (req, res) => {
    try {
        res.render('categories/form', { 
            title: 'Create New Category',
            category: null, // Null indicates creation mode
            user: req.user || null, 
            req: req,
            messages: req.flash()
        });
    } catch (err) {
        console.error("Error loading new category form:", err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Failed to load category form.',
            user: req.user || null,
            req: req 
        });
    }
};


module.exports = {
    createCategory: exports.createCategory,
    getAllCategories: exports.getAllCategories,
    viewManageCategoriesPage: exports.viewManageCategoriesPage,
    viewNewCategoryPage: exports.viewNewCategoryPage // Ensure this is exported
};