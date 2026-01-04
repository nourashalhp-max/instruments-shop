// middleware/authJwt.js
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config'); // Ensure this path is correct
const db = require('../models');
const User = db.User;

// Helper function to clear the access token cookie
const clearAccessTokenCookie = (res) => {
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/'
    });
};

// Middleware to verify JWT token and attach user to req (for EJS views)
const verifyTokenForViews = async (req, res, next) => {
    // --- START DIAGNOSTIC LOGS ---
    // console.log(`[verifyTokenForViews] Processing request for: ${req.path}`);
    // console.log(`[verifyTokenForViews] req.cookies (parsed by cookie-parser):`, req.cookies);
    // --- END DIAGNOSTIC LOGS ---

    let token = req.cookies.accessToken;

    if (!token) {
        req.user = null; // No token found in cookies
        // console.log("[verifyTokenForViews] No accessToken cookie found. Setting req.user = null.");
        return next(); // Proceed, let frontend routes decide what to do
    }

    // --- DIAGNOSTIC LOG: Token found ---
    // console.log(`[verifyTokenForViews] Token found: ${token.substring(0, 20)}...`);
    // --- END DIAGNOSTIC LOG ---

    try {
        const decoded = jwt.verify(token, config.secret); // Using config.secret
        // console.log(`[verifyTokenForViews] Token decoded. User ID: ${decoded.id}`);

        const user = await User.findByPk(decoded.id, {
            attributes: ['user_id', 'username', 'email', 'role', 'firstName', 'lastName', 'shippingAddress', 'city', 'postalCode', 'country']
        });

        if (!user) {
            console.warn("[verifyTokenForViews] Token valid, but user ID not found in DB:", decoded.id);
            req.user = null;
            clearAccessTokenCookie(res); // Clear the invalid cookie
            return next();
        }

        req.user = user.toJSON(); // Attach the user object (plain JSON) to the request
        // console.log(`[verifyTokenForViews] User authenticated via token: ${req.user.email}. Setting req.user.`);
        next(); // Proceed
    } catch (error) {
        console.warn("[verifyTokenForViews] Invalid or expired token:", error.message);
        req.user = null; // Token is invalid/expired
        clearAccessTokenCookie(res); // Clear the invalid/expired cookie
        next(); // Proceed, but without a user
    }
};

// Middleware to check if the user is authenticated (for protecting frontend routes)
const isAuthenticated = (req, res, next) => {
    if (req.user && req.user.user_id) { // Ensure user object and user_id exist
        // console.log("[isAuthenticated] User is authenticated. Proceeding.");
        next(); // User is authenticated, proceed
    } else {
        // console.log("Access Denied: User not authenticated. Redirecting to login.");
        req.flash('error', 'You must be logged in to access this page.'); // Use flash
        res.redirect('/login');
    }
};

// Middleware to check if the user has an 'admin' role (for EJS views)
const isAdmin = async (req, res, next) => {
    if (!req.user || !req.user.role) {
        // Not authenticated or role information missing
        req.flash('error', 'You must be logged in as an admin to access this page.');
        return res.redirect('/login'); // Redirect to login
    }

    if (req.user.role === 'admin') {
        // console.log(`[isAdmin] User ${req.user.email} is an admin. Proceeding.`);
        next();
    } else {
        // console.log(`[isAdmin] Access Denied: User ${req.user.email} is not an admin. Role: ${req.user.role}`);
        req.flash('error', 'You do not have administrative privileges to access this page.');
        res.redirect('/dashboard'); // Redirect non-admins to dashboard
    }
};

// Middleware to authorize roles (generic, takes an array of roles)
const authorizeRoles = (roles = []) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            // Not authenticated or role information missing
            const isApiRoute = req.originalUrl.startsWith('/api');
            if (isApiRoute) {
                return res.status(403).json({ message: 'Authentication required. No user or role information found.' });
            } else {
                req.flash('error', 'Authentication required to access this resource.');
                return res.redirect('/login');
            }
        }

        if (roles.includes(req.user.role)) {
            // console.log(`[authorizeRoles] User ${req.user.email} with role '${req.user.role}' is authorized for roles: ${roles.join(', ')}. Proceeding.`);
            next(); // User has one of the required roles
        } else {
            // User does not have the required role
            const isApiRoute = req.originalUrl.startsWith('/api');
            if (isApiRoute) {
                return res.status(403).json({ message: `Access Denied: Requires one of the following roles: ${roles.join(' or ')}.` });
            } else {
                req.flash('error', `Access Denied: You do not have permission to access this page. Required roles: ${roles.join(', ')}.`);
                return res.redirect('/dashboard');
            }
        }
    };
};

// For API routes, this middleware immediately rejects unauthenticated requests
const verifyTokenForApi = (req, res, next) => {
    let token = req.cookies.accessToken; // First, check for token in cookies

    // If no token in cookies, then check for it in Authorization header
    if (!token) {
        let authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }

    if (!token) {
        return res.status(403).json({ message: "No token provided! Access denied." });
    }

    jwt.verify(token, config.secret, async (err, decoded) => { // Using config.secret
        if (err) {
            clearAccessTokenCookie(res); // Clear the cookie if the token is invalid/expired
            return res.status(401).json({ message: "Unauthorized! Invalid or expired Token." });
        }
        try {
            const user = await User.findByPk(decoded.id, {
                attributes: ['user_id', 'username', 'email', 'role', 'firstName', 'lastName', 'shippingAddress', 'city', 'postalCode', 'country']
            });
            if (!user) {
                return res.status(404).json({ message: "User not found for token." });
            }
            req.user = user.toJSON(); // Attach full user object (plain JSON) to req
            next();
        } catch (dbErr) {
            console.error("DB Error in verifyTokenForApi:", dbErr);
            return res.status(500).json({ message: "Internal server error during token verification." });
        }
    });
};

module.exports = {
    verifyTokenForViews,
    isAuthenticated,
    isAdmin,
    authorizeRoles,
    verifyTokenForApi
};