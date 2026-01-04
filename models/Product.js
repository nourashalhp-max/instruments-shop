// models/Product.js
// Removed `const { DataTypes } = require('sequelize');` - it's passed as argument
// Removed `const { sequelize } = require('../config/db.config');` - it's passed as argument
module.exports = (sequelize, DataTypes) => { // <-- CRITICAL: Add DataTypes here
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2), // Use DECIMAL for currency for precision
            allowNull: false,
            defaultValue: 0.00
        },
        stock: { // Added stock field
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        image: {
            type: DataTypes.STRING, // Path to product image
            allowNull: true
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: true, // Can be null if a product doesn't have a category initially
            references: {
                model: 'Categories', // Table name
                key: 'id'
            }
        }
    }, {
        timestamps: true,
        tableName: 'Products'
    });

    Product.associate = (models) => {
        Product.belongsTo(models.Category, {
            foreignKey: 'categoryId',
            as: 'category',
            onDelete: 'SET NULL'
        });

        Product.hasMany(models.CartItem, {
            foreignKey: 'productId',
            as: 'cartItems',
            onDelete: 'SET NULL' // If product is deleted, cart item's productId becomes null
        });

        Product.hasMany(models.OrderDetail, {
            foreignKey: 'productId',
            as: 'orderDetails',
            onDelete: 'RESTRICT' // Prevents deleting a product if it's part of an order
        });
        Product.hasMany(models.Review, { foreignKey: 'productId', as: 'reviews' });
    };

    return Product;
};