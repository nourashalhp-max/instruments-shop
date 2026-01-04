// routes/auth.routes.js (UNCHANGED)

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Route for creating a new user (Signup)
// POST /api/auth/signup
router.post('/signup', authController.signup);

// Route for authenticating a user (Login)
// POST /api/auth/login
router.post('/login', authController.login);

// Keeping this here for /api/auth/logout, if needed later for client-side API calls
router.get('/logout', authController.logout);

module.exports = router;