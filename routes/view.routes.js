// routes/view.routes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const { isAuthenticated, authorizeRoles } = require('../middleware/authJwt');

// --- General Site Views ---
router.get('/', (req, res) => {
    res.render('index', { 
        title: 'Home', 
        user: req.user || null,
        req: req // <--- FIX APPLIED
    });
});

router.get('/about', (req, res) => {
    res.render('about', { 
        title: 'About Us', 
        user: req.user || null,
        req: req // <--- FIX APPLIED
    });
});

// ... (Product routes remain commented out as per your original file) ...

// --- User Management Views (Admin) ---
router.get('/users', isAuthenticated, authorizeRoles(['admin']), async (req, res) => {
    try {
        const users = await db.User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'createdAt']
        });
        res.render('users/list', {
            title: 'Users',
            users: users,
            user: req.user || null,
            messages: req.flash(),
            req: req // <--- FIX APPLIED
        });
    } catch (error) {
        console.error("Error rendering users list:", error);
        req.flash('error', 'Failed to load users: ' + error.message);
        res.redirect('/dashboard');
    }
});

router.get('/users/new', isAuthenticated, authorizeRoles(['admin']), (req, res) => {
    res.render('users/form', {
        title: 'New User',
        user: null,
        currentUser: req.user || null,
        messages: req.flash(),
        req: req // <--- FIX APPLIED
    });
});

router.get('/users/:id/edit', isAuthenticated, authorizeRoles(['admin']), async (req, res) => {
    try {
        const userToEdit = await db.User.findByPk(req.params.id, {
            attributes: ['id', 'username', 'email', 'role', 'firstName', 'lastName', 'shippingAddress', 'city', 'postalCode', 'country']
        });
        if (!userToEdit) {
            req.flash('error', 'User not found for editing.');
            return res.redirect('/users');
        }
        res.render('users/form', {
            title: 'Edit User',
            user: userToEdit,
            currentUser: req.user || null,
            messages: req.flash(),
            req: req // <--- FIX APPLIED
        });
    } catch (error) {
        console.error("Error rendering user edit form:", error);
        req.flash('error', 'Failed to load user for editing: ' + error.message);
        res.redirect('/users');
    }
});

router.get('/profile', isAuthenticated, (req, res) => {
    res.render('users/profile', {
        title: 'User Profile',
        user: req.user || null,
        messages: req.flash(),
        req: req // <--- FIX APPLIED
    });
});

module.exports = router;