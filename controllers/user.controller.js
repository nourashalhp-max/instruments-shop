const bcrypt = require('bcryptjs');
const db = require('../models');
const { User, Product, Order, Category, OrderDetail } = db;

// --- Admin Order Management Functions ---

// 1. Display all orders for the admin
exports.viewAdminOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, as: 'user', attributes: ['username', 'email'] },
                { 
                    model: OrderDetail, 
                    as: 'details', 
                    include: [{ model: Product, as: 'product', attributes: ['name'] }] 
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.render('admin/orders', {
            title: 'Manage Orders',
            orders: orders,
            user: req.user,
            req: req,
            messages: req.flash()
        });
    } catch (error) {
        console.error("Error fetching admin orders:", error);
        req.flash('error', 'Could not load orders.');
        res.redirect('/dashboard');
    }
};

// 2. Update order status with Stock Management
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status: newStatus } = req.body;

        // Fetch order with details to access product IDs and quantities
        const order = await Order.findByPk(orderId, {
            include: [{ model: OrderDetail, as: 'details' }]
        });

        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/admin/orders');
        }

        const oldStatus = order.status;

        // --- STOCK LOGIC ---

        // A. STOCK RETURN: If moving TO 'Cancelled' from any active state
        if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
            for (const item of order.details) {
                const product = await Product.findByPk(item.productId);
                if (product) {
                    product.stock += item.quantity; // Add back to inventory
                    await product.save();
                }
            }
        } 
        
        // B. RE-SUBTRACT STOCK: If moving OUT of 'Cancelled' back to an active state
        // This ensures stock is removed again if you un-cancel an order
        else if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled') {
            for (const item of order.details) {
                const product = await Product.findByPk(item.productId);
                if (product) {
                    if (product.stock < item.quantity) {
                        req.flash('error', `Cannot reactivate: ${product.name} is out of stock.`);
                        return res.redirect('/admin/orders');
                    }
                    product.stock -= item.quantity;
                    await product.save();
                }
            }
        }

        // --- FINALIZE STATUS ---
        await order.update({ status: newStatus });
        
        req.flash('success', `Order #${orderId} updated to ${newStatus}.`);
        res.redirect('/admin/orders');

    } catch (error) {
        console.error("Status Update Error:", error);
        req.flash('error', 'Failed to update order: ' + error.message);
        res.redirect('/admin/orders');
    }
};

// --- Admin Dashboard View ---
exports.viewDashboardPage = async (req, res) => {
    try {
        const stats = {
            users: await User.count(),
            products: await Product.count(),
            orders: await Order.count(),
            categories: await Category.count()
        };

        const lowStockProducts = await Product.findAll({
            where: { stock: { [db.Sequelize.Op.lt]: 5 } },
            attributes: ['id', 'name', 'stock'],
            limit: 5 
        });

        res.render('dashboard', { 
            title: 'Admin Dashboard',
            user: req.user,
            req: req,
            messages: req.flash(),
            stats,
            lowStockProducts
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.render('dashboard', { 
            title: 'Admin Dashboard', 
            user: req.user, req: req, messages: req.flash(),
            stats: { users: 0, products: 0, orders: 0, categories: 0 },
            lowStockProducts: []
        });
    }
};

// --- User Management (CRUD) ---
exports.findAll = async (req, res) => {
    return await User.findAll({ attributes: ['user_id', 'username', 'email', 'role', 'createdAt'] });
};

exports.create = async (req, res) => {
    try {
        const { username, email, password, role, firstName, lastName } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, email, password: hashedPassword, role: role || 'user', firstName, lastName });
        req.flash('success', 'User created successfully!');
        res.redirect('/users');
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/users/new');
    }
};

exports.findOne = async (req, res) => {
    return await User.findByPk(req.params.id);
};

exports.update = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
        await user.update(req.body);
        req.flash('success', 'User updated!');
        res.redirect('/users');
    } catch (error) {
        res.redirect(`/users/${req.params.id}/edit`);
    }
};

exports.delete = async (req, res) => {
    await User.destroy({ where: { user_id: req.params.id } });
    req.flash('success', 'User deleted!');
    res.redirect('/users');
};