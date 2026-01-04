const db = require('../models');
const Order = db.Order;
const OrderDetail = db.OrderDetail;
const Cart = db.Cart;
const CartItem = db.CartItem;
const Product = db.Product;

exports.viewOrdersPage = async (req, res) => { 
    const userId = req.user ? req.user.user_id : null; 
    if (!userId) {
        req.flash('error', 'Authentication required.');
        return res.redirect('/login');
    }
    try {
        const orders = await Order.findAll({
            where: { userId },
            include: [{
                model: OrderDetail,
                as: 'details',
                include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'image'] }]
            }],
            order: [['orderDate', 'DESC']]
        });
        res.render('orders/list', { title: 'My Orders', orders, messages: req.flash(), user: req.user, req });
    } catch (err) {
        res.redirect('/products');
    }
};

exports.placeOrder = async (req, res) => {
    const userId = req.user ? req.user.user_id : null; 
    const { shippingAddress, city, postalCode, country, paymentMethod, location } = req.body;

    if (!userId) return res.redirect('/login');

    // --- CRITICAL FIX: SERVER-SIDE VALIDATION ---
    // This prevents empty orders even if the HTML "required" is bypassed
    if (!shippingAddress || !city || !postalCode || !country || !paymentMethod) {
        req.flash('error', 'Please fill in all required shipping and payment information.');
        return res.redirect('/checkout'); 
    }

    const transaction = await db.sequelize.transaction();
    try {
        const cart = await Cart.findOne({
            where: { userId },
            include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
            transaction
        });

        if (!cart || cart.items.length === 0) {
            await transaction.rollback();
            req.flash('error', 'Your cart is empty.');
            return res.redirect('/cart');
        }

        let totalAmount = 0;
        const orderItemsToProcess = [];

        for (const item of cart.items) {
            const product = item.product;
            if (!product || product.stock < item.quantity) {
                // If stock ran out while the user was on the checkout page
                throw new Error(`Insufficient stock for ${product ? product.name : 'item'}.`);
            }
            totalAmount += item.quantity * product.price;
            orderItemsToProcess.push({
                productId: product.id,
                quantity: item.quantity,
                price: product.price,
                remainingStock: product.stock - item.quantity
            });
        }

        // Create the Main Order
        const order = await Order.create({
            userId, 
            totalAmount, 
            shippingAddress, 
            city, 
            postalCode, 
            country, 
            paymentMethod, 
            deliveryLocation: location, 
            status: 'Processing'
        }, { transaction });

        // Create Order Details and Update Product Stock
        for (const item of orderItemsToProcess) {
            await OrderDetail.create({
                orderId: order.id, 
                productId: item.productId, 
                quantity: item.quantity, 
                price: item.price
            }, { transaction });

            await Product.update(
                { stock: item.remainingStock }, 
                { where: { id: item.productId }, transaction }
            );
        }

        // Clear the User's Cart
        await CartItem.destroy({ where: { cartId: cart.id }, transaction });
        
        await transaction.commit();
        res.redirect(`/orders/confirmation/${order.id}`);
    } catch (err) {
        if (transaction) await transaction.rollback();
        req.flash('error', err.message);
        res.redirect('/cart');
    }
};

exports.showConfirmation = async (req, res) => {
    const userId = req.user ? req.user.user_id : null;
    try {
        const order = await Order.findOne({
            where: { id: req.params.orderId, userId },
            include: [{ model: OrderDetail, as: 'details', include: [{ model: Product, as: 'product' }] }]
        });
        if (!order) return res.redirect('/orders');
        res.render('orders/confirmation', { title: 'Order Confirmed', order, messages: req.flash(), user: req.user, req });
    } catch (err) { res.redirect('/orders'); }
};

exports.listUserOrdersApi = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const orders = await Order.findAll({ where: { userId } });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};