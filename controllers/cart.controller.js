const db = require('../models');
const { Cart, CartItem, Product } = db;

// Utility for fetching cart count (used in headers)
const getUserCart = async (userId) => {
    if (!userId) return { itemCount: 0 };
    try {
        const cart = await Cart.findOne({ 
            where: { userId }, 
            include: [{ model: CartItem, as: 'items' }]
        });
        const itemCount = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        return { itemCount };
    } catch (err) {
        return { itemCount: 0 };
    }
};

const addToCart = async (req, res) => {
    const userId = req.user ? req.user.user_id : null; 
    const { productId } = req.body;
    const quantity = req.body.quantity || req.body.qty || 1;

    if (!userId) {
        req.flash('error', 'Login required.');
        return res.redirect('/login');
    }

    try {
        const product = await Product.findByPk(productId);
        if (!product || product.stock <= 0) {
            req.flash('error', 'Item is out of stock.');
            return res.redirect('back');
        }

        const parsedQuantity = parseInt(quantity);
        const [cart] = await Cart.findOrCreate({ where: { userId } });
        let cartItem = await CartItem.findOne({ where: { cartId: cart.id, productId } });

        if (cartItem) {
            // Validate against total stock
            if (cartItem.quantity + parsedQuantity > product.stock) {
                req.flash('error', `Cannot add more. Total stock is ${product.stock}.`);
                return res.redirect('/cart');
            }
            cartItem.quantity += parsedQuantity;
            await cartItem.save();
        } else {
            await CartItem.create({
                cartId: cart.id,
                productId,
                quantity: parsedQuantity,
                price: product.price 
            });
        }

        req.flash('success', 'Added to cart!');
        res.redirect('/cart');
    } catch (err) {
        req.flash('error', 'Failed to add item.');
        res.redirect('/products');
    }
};

const getCart = async (req, res) => {
    const userId = req.user ? req.user.user_id : null;
    if (!userId) return res.status(401).json({ message: "Auth required" });

    try {
        const cart = await Cart.findOne({
            where: { userId },
            include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
        });
        if (!cart) return res.json({ items: [], total: 0 });

        const items = cart.items.map(item => ({
            ...item.toJSON(),
            subtotal: item.quantity * item.price
        }));
        res.json({ items, total: items.reduce((s, i) => s + i.subtotal, 0) });
    } catch (err) { res.status(500).json({ message: "Error" }); }
};

const viewCartPage = async (req, res) => {
    const userId = req.user ? req.user.user_id : null;
    if (!userId) return res.redirect('/login');

    try {
        const cart = await Cart.findOne({
            where: { userId },
            include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
        });

        let total = 0;
        let items = [];
        if (cart) {
            items = cart.items.map(i => {
                const subtotal = i.quantity * i.price;
                total += subtotal;
                return { ...i.toJSON(), product: i.product, subtotal };
            });
        }

        res.render('cart/details', { 
            title: 'Cart', 
            cart: { items, total }, 
            user: req.user, 
            req, 
            messages: req.flash() 
        });
    } catch (err) { res.redirect('/dashboard'); }
};

const updateCartItemQuantity = async (req, res) => {
    const userId = req.user ? req.user.user_id : null;
    const { productId } = req.params;
    let { quantity } = req.body;
    quantity = parseInt(quantity);

    try {
        const product = await Product.findByPk(productId);
        
        // Safety: If stock is 0 or less than requested
        if (product.stock <= 0) {
            req.flash('error', 'This item just sold out.');
            // Optional: remove it from cart automatically
            return res.redirect('/cart');
        }

        if (quantity > product.stock) {
            req.flash('error', `Only ${product.stock} items available in stock.`);
            quantity = product.stock; // Set to max available instead of just failing
        }

        const cart = await Cart.findOne({ where: { userId } });
        const cartItem = await CartItem.findOne({ where: { cartId: cart.id, productId } });

        if (quantity <= 0) {
            await cartItem.destroy();
        } else {
            cartItem.quantity = quantity;
            await cartItem.save();
        }
        res.redirect('/cart');
    } catch (err) { res.redirect('/cart'); }
};

const removeCartItem = async (req, res) => {
    const userId = req.user ? req.user.user_id : null;
    try {
        const cart = await Cart.findOne({ where: { userId } });
        await CartItem.destroy({ where: { cartId: cart.id, productId: req.params.productId } });
        res.redirect('/cart');
    } catch (err) { res.redirect('/cart'); }
};

const clearCart = async (req, res) => {
    const userId = req.user ? req.user.user_id : null;
    try {
        const cart = await Cart.findOne({ where: { userId } });
        if (cart) await CartItem.destroy({ where: { cartId: cart.id } });
        res.redirect('/cart');
    } catch (err) { res.redirect('/cart'); }
};

module.exports = { getCart, addToCart, removeCartItem, updateCartItemQuantity, clearCart, viewCartPage, getUserCart };