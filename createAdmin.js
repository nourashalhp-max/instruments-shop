// createAdmin.js
require('dotenv').config(); // Load environment variables first

const bcrypt = require('bcryptjs');
// Import the entire 'db' object from models/index.js
const db = require('./models');

// Extract the sequelize instance and User model from the db object
const sequelize = db.sequelize; // <--- Correctly get the sequelize instance
const User = db.User;         // <--- Correctly get the User model

// Admin credentials (CHANGE THESE FOR PRODUCTION)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpassword';

async function createAdminUser() {
    try {
        // Authenticate the database connection
        // You need to access the authenticate method via the sequelize instance
        await sequelize.authenticate(); // <--- CRITICAL FIX: Use 'sequelize.authenticate()'
        console.log('Database connection has been established successfully.');

        // Synchronize models (ensure tables exist or are updated)
        // For a script like this, you might not need to sync all models if your main app does it
        // But if you're running this independently, it's safer to ensure the User table exists.
        // Or you can directly use `await User.sync({ alter: true });` if you only need the User table.
        // For a clean script, let's sync all.
        await sequelize.sync({ alter: true }); // This ensures all tables are up to date
        console.log('All models synchronized successfully.');

        // Hash the admin password
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Check if an admin user already exists to prevent duplicates
        const existingAdmin = await User.findOne({ where: { email: ADMIN_EMAIL } });

        if (existingAdmin) {
            console.log('Admin user already exists:', ADMIN_EMAIL);
            // Optionally update password if it changed
            if (!bcrypt.compareSync(ADMIN_PASSWORD, existingAdmin.password)) {
                existingAdmin.password = hashedPassword;
                await existingAdmin.save();
                console.log('Admin password updated.');
            }
        } else {
            // Create the admin user
            const newAdmin = await User.create({
                username: ADMIN_USERNAME,
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: 'admin', // Set the role to 'admin'
                // You can add other default admin fields if needed
                firstName: 'Super',
                lastName: 'Admin'
            });
            console.log(`Admin user created successfully: ${newAdmin.username} (${newAdmin.email})`);
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        // Close the database connection gracefully
        // You need to access the close method via the sequelize instance
        if (sequelize) { // <--- CRITICAL FIX: Check if sequelize is defined before closing
            await sequelize.close(); // <--- Use 'sequelize.close()'
            console.log('Database connection closed.');
        }
    }
}

// Execute the function
createAdminUser();