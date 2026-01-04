// server.js
// ==========================================================
// IMPORTS AND CONFIGURATION
// ==========================================================
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const ejsLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');

const db = require('./models'); 

const {
    verifyTokenForViews,
    isAuthenticated, 
    authorizeRoles
} = require('./middleware/authJwt');

const authController = require('./controllers/auth.controller');
const cartController = require('./controllers/cart.controller'); 
const orderController = require('./controllers/order.controller'); 
const userController = require('./controllers/user.controller'); 

// Import Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const productApiRoutes = require('./routes/product.routes');
const cartApiRoutes = require('./routes/cart.routes');
const orderApiRoutes = require('./routes/order.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const productViewRoutes = require('./routes/productView.routes');
const categoryViewRoutes = require('./routes/categoryView.routes');
const userViewRoutes = require('./routes/userView.routes');
const viewRoutes = require('./routes/view.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================================
// Middleware Setup
// ==========================================================
app.use(ejsLayouts);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'Lax'
    }
}));
app.use(flash());
app.use(cors());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Apply JWT verification to all EJS routes
app.use(verifyTokenForViews);

// ==========================================================
// ADMIN ROUTES (Placed High for Priority)
// ==========================================================

// Dashboard
app.get('/dashboard', isAuthenticated, authorizeRoles(['admin']), userController.viewDashboardPage);

// Admin Order Management
app.get('/admin/orders', isAuthenticated, authorizeRoles(['admin']), userController.viewAdminOrders);
app.post('/admin/orders/:orderId/status', isAuthenticated, authorizeRoles(['admin']), userController.updateOrderStatus);

// ==========================================================
// AUTH & USER ROUTES
// ==========================================================
app.get('/login', (req, res) => {
    if (req.user) return req.user.role === 'admin' ? res.redirect('/dashboard') : res.redirect('/');
    res.render('auth/login', { title: 'Login', messages: req.flash(), user: req.user || null, req: req });
});

app.get('/register', (req, res) => {
    if (req.user) return req.user.role === 'admin' ? res.redirect('/dashboard') : res.redirect('/');
    res.render('auth/register', { title: 'Register', messages: req.flash(), user: req.user || null, req: req });
});

app.get('/logout', (req, res) => authController.logout(req, res));

// ==========================================================
// CUSTOMER VIEW ROUTES
// ==========================================================
app.get('/cart', isAuthenticated, cartController.viewCartPage);
app.get('/orders', isAuthenticated, orderController.viewOrdersPage);
app.get('/orders/confirmation/:orderId', isAuthenticated, orderController.showConfirmation);

// ==========================================================
// ROUTER MODULES
// ==========================================================
app.use('/checkout', checkoutRoutes);
app.use('/products', productViewRoutes);
app.use('/categories', categoryViewRoutes);
app.use('/users', userViewRoutes); 
app.use('/', viewRoutes); // General views mounted last

// API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productApiRoutes);
app.use('/api/cart', cartApiRoutes);
app.use('/api/orders', orderApiRoutes);

// ==========================================================
// 404 CATCH-ALL
// ==========================================================
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found', user: req.user || null, req: req });
});

// ==========================================================
// SERVER STARTUP
// ==========================================================
async function startServer() {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.sync({ force: false });
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    } catch (error) {
        console.error('❌ Startup failed:', error);
        process.exit(1);
    }
}
startServer();