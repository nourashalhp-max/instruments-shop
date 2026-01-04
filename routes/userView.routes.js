// routes/userView.routes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const { isAuthenticated, authorizeRoles } = require('../middleware/authJwt');

// --- 1. GET /users (List all users - Admin View) ---
router.get('/', isAuthenticated, authorizeRoles(['admin']), async (req, res) => {
    try {
        const users = await db.User.findAll({
            attributes: ['user_id', 'username', 'email', 'role', 'createdAt'],
            order: [['user_id', 'ASC']]
        });
        
        res.render('users/list', { 
            title: 'Manage Users',
            users: users,
            user: req.user || null,
            req: req, 
            messages: req.flash()
        });
    } catch (error) {
        console.error("Error loading manage users page:", error); 
        req.flash('error', 'Failed to load user management page.');
        res.redirect('/dashboard'); 
    }
});


// ------------------------------------------------------------------
// --- FIX: PLACE '/new' ROUTE BEFORE '/:user_id/edit' ROUTE ---
// ------------------------------------------------------------------


// --- 2. GET /users/new (Load New User Form) ---
// THIS MUST BE FIRST: Specific routes go before parameterized routes.
router.get('/new', isAuthenticated, authorizeRoles(['admin']), (req, res) => {
    res.render('users/form', {
        title: 'New User',
        user: req.user || null,
        req: req,
        // Pass a blank user object to prevent EJS from crashing when accessing properties
        targetUser: {}, 
        isEditing: false,
        messages: req.flash()
    });
});


// --- 3. POST /users (Handle New User Form Submission - Placeholder) ---
router.post('/', isAuthenticated, authorizeRoles(['admin']), async (req, res) => {
    try {
        // ... (Creation logic, password hashing, and db.User.create must be implemented here) ...
        
        req.flash('success', 'User creation submitted successfully (IMPLEMENTATION NEEDED).');
        res.redirect('/users'); // Redirect to the list view after attempt
        
    } catch (error) {
        console.error("Error creating user:", error);
        req.flash('error', `Failed to create user: ${error.message}`);
        res.redirect('/users/new'); 
    }
});


// --- 4. GET /users/:user_id/edit (Load Edit User Form) ---
// THIS MUST BE LAST: Parameterized routes go after specific routes.
router.get('/:user_id/edit', isAuthenticated, authorizeRoles(['admin']), async (req, res) => {
    try {
        const targetUser = await db.User.findByPk(req.params.user_id, {
            attributes: { exclude: ['password'] }
        });

        if (!targetUser) {
            req.flash('error', 'User not found.');
            return res.redirect('/users');
        }

        res.render('users/form', {
            title: `Edit User: ${targetUser.username}`,
            user: req.user || null,
            req: req,
            targetUser: targetUser.get({ plain: true }), 
            isEditing: true,
            messages: req.flash()
        });
    } catch (error) {
        console.error("Error loading edit user page:", error);
        req.flash('error', 'Failed to load user edit page.');
        res.redirect('/users');
    }
});


module.exports = router;