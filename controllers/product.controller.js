const db = require('../models');
const Product = db.Product;
const Category = db.Category;
const fs = require('fs'); 
const path = require('path'); 
const { Op } = require('sequelize');

const getImagePath = (file) => {
    if (!file) return null;
    return `/uploads/product_images/${file.filename}`;
};

exports.listProducts = async (req, res) => {
    try {
        const { category, search, lowStock } = req.query;
        let whereClause = {};

        if (search && search.trim() !== '') {
            whereClause.name = { [Op.like]: `%${search.trim()}%` };
        }

        if (category) {
            whereClause.categoryId = category;
        }

        if (lowStock === 'true') {
            whereClause.stock = { [Op.lte]: 3, [Op.gt]: 0 };
        }

        const products = await Product.findAll({
            where: whereClause,
            include: [{ model: Category, as: 'category' }],
            order: [['name', 'ASC']]
        });

        const categories = await Category.findAll({ order: [['name', 'ASC']] });
        const currentCategory = category ? await Category.findByPk(category) : null;

        res.render('products/list', { 
            title: 'Products',
            products,
            categories,
            currentCategory,
            user: req.user,
            req: req,
            messages: req.flash()
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, categoryId } = req.body; 
        const imageUrl = getImagePath(req.file);

        if (!name || !price || !categoryId || typeof stock === 'undefined') { 
            if (req.file) {
                const filePath = path.join(__dirname, '..', 'public', imageUrl);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            req.flash('error', 'Name, price, stock, and category are required.');
            return res.redirect('/products/new');
        }

        await Product.create({
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
            categoryId: parseInt(categoryId),
            image: imageUrl
        });

        req.flash('success', 'Product created successfully!');
        return res.redirect('/products');
    } catch (error) {
        req.flash('error', `Error: ${error.message}`);
        return res.redirect('/products/new');
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, price, stock, categoryId } = req.body;
        const product = await Product.findByPk(productId);
        
        if (!product) return res.redirect('/products');

        if (req.file) {
            const imageUrl = getImagePath(req.file);
            if (product.image) {
                const oldPath = path.join(__dirname, '..', 'public', product.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            product.image = imageUrl;
        }

        product.name = name || product.name;
        product.description = description || product.description;
        product.price = parseFloat(price) || product.price;
        if (stock !== undefined) product.stock = parseInt(stock);
        product.categoryId = parseInt(categoryId) || product.categoryId;

        await product.save();
        req.flash('success', 'Product updated!');
        return res.redirect('/products');
    } catch (error) {
        res.redirect(`/products/${req.params.id}/edit`);
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (product && product.image) {
            const imagePath = path.join(__dirname, '..', 'public', product.image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
        if (product) await product.destroy();
        res.redirect('/products');
    } catch (error) {
        res.redirect('/products');
    }
};

// API style helpers
exports.getAllProducts = async (req, res) => {
    const products = await Product.findAll({ include: [{ model: Category, as: 'category' }] });
    res.status(200).json(products);
};

exports.getProductById = async (req, res) => {
    const product = await Product.findByPk(req.params.id, { include: [{ model: Category, as: 'category' }] });
    res.status(200).json(product);
};