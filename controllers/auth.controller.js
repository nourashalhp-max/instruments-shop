// controllers/auth.controller.js
const db = require('../models');
const User = db.User; 

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config'); // <-- Make sure this path is correct

// --- Helper Functions ---

// 1. SIGNUP (Create a new user)
exports.signup = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        if (!username || !email || !password) {
            console.log("Signup Error: Missing username, email, or password in request body.");
            return res.status(400).send({ message: "Username, email, and password are required." });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            console.log("Signup Error: Email already in use:", email);
            return res.status(400).send({ message: "Email is already in use!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username: username,
            email: email,
            password: hashedPassword,
            firstName: firstName || null,
            lastName: lastName || null,
            role: 'user'
        });

        console.log("User registered successfully:", user.email);
        return res.redirect('/login?success=Registration successful. Please log in.');

    } catch (error) {
        console.error("Signup Catch Error:", error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).send({ message: "Validation failed", errors: errors });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).send({ message: "A user with this username or email already exists." });
        }
        return res.status(500).send({ message: "An unexpected error occurred during registration." });
    }
};

// 2. LOGIN (Verify credentials and issue a JWT)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Attempting login for email:", email);

        if (!email || !password) {
            console.log("Login Error: Missing email or password in request body.");
            return res.redirect('/login?error=Email and password are required.');
        }

        const user = await User.findOne({
            where: { email: email }
        });

        if (!user) {
            console.log("Login Error: User not found for email:", email);
            return res.redirect('/login?error=Invalid email or password.');
        }
        console.log("User found:", user.email);

        const passwordIsValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordIsValid) {
            console.log("Login Error: Invalid Password for user:", user.email);
            return res.redirect('/login?error=Invalid email or password.');
        }
        console.log("Password is valid for user:", user.email);

        const token = jwt.sign(
            { id: user.user_id },
            config.secret,
            {
                expiresIn: 86400, // 24 hours
                algorithm: 'HS256'
            }
        );

        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 86400 * 1000, // 24 hours in milliseconds
            path: '/'
        });

        console.log(`User ${user.email} logged in successfully.`);
        
        // --- CRITICAL FIX: Redirect based on role to avoid redirect loop for standard users ---
        if (user.role === 'admin') {
            console.log("Redirecting admin to /dashboard.");
            return res.redirect('/dashboard');
        } else {
            console.log("Redirecting standard user to /.");
            // Standard users should be sent to the general user view, usually the root shop page.
            return res.redirect('/'); 
        }

    } catch (error) {
        console.error("Login Catch Error:", error);
        return res.redirect('/login?error=An unexpected error occurred during login.');
    }
};

// 3. LOGOUT (Clear JWT cookie)
exports.logout = (req, res) => {
    try {
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            path: '/'
        });
        console.log("Logout successful. Cleared accessToken cookie.");
        return res.redirect('/login?success=You have been logged out.');
    } catch (error) {
        console.error("Logout error:", error);
        return res.redirect('/login?error=Error during logout.');
    }
};