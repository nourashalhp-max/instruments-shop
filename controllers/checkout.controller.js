// controllers/checkout.controller.js
const db = require('../models');
const Cart = db.Cart;
const CartItem = db.CartItem;
const Product = db.Product;
const User = db.User;
const orderController = require('./order.controller'); // Import order controller for placing order logic

// GET /checkout - Display the checkout form
exports.showCheckoutForm = async (req, res) => {
    const userId = req.user ? req.user.user_id : null;

    if (!userId) {
        req.flash('error', 'Please log in to proceed to checkout.');
        return res.redirect('/login');
    }

    try {
        const cart = await Cart.findOne({
            where: { userId },
            include: [{
                model: CartItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'price', 'image']
                }]
            }]
        });

        if (!cart || cart.items.length === 0) {
            req.flash('error', 'Your cart is empty. Please add products before checking out.');
            return res.redirect('/cart');
        }

        const user = await User.findByPk(userId); // Fetch user details for pre-filling address

        let total = 0;
        const cartItems = cart.items.map(item => {
            const itemSubtotal = item.quantity * item.price;
            total += itemSubtotal;
            return {
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                product: item.product,
                subtotal: itemSubtotal
            };
        });

        res.render('checkout/index', {
            title: 'Checkout',
            cart: {
                id: cart.id,
                userId: userId,
                items: cartItems,
                total: total
            },
            user: user, // Pass the full user object to pre-fill address fields
            messages: req.flash(),
            // FIX APPLIED HERE: Pass the req object to the view to prevent "req is not defined" errors
            req: req 
        });

    } catch (err) {
        console.error("Error displaying checkout form:", err);
        req.flash('error', 'Could not load checkout page. Please try again.');
        res.redirect('/cart');
    }
};

// POST /checkout/place-order - Handles the actual order placement
// This function will directly call the placeOrder from order.controller.js
exports.placeOrder = orderController.placeOrder;