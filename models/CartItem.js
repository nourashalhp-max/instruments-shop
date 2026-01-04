// models/CartItem.js
// Removed `const { DataTypes } = require('sequelize');` - it's passed as argument
module.exports = (sequelize, DataTypes) => { // <-- CRITICAL: Add DataTypes here
    const CartItem = sequelize.define('CartItem', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        price: { // CRITICAL FIX: Add price to store current product price
            type: DataTypes.DECIMAL(10, 2), // Use DECIMAL for precision
            allowNull: false
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: true, // Allow NULL to match 'onDelete: SET NULL' in Product.js
            references: {
                model: 'Products', // Name of the target table
                key: 'id'           // Primary key of the target table
            }
        },
        cartId: {
            type: DataTypes.INTEGER,
            allowNull: false, // CartItem must always belong to a cart
            references: {
                model: 'Carts', // Name of the target table
                key: 'id'           // Primary key of the target table
            }
        }
    }, {
        timestamps: true, // Good practice to include
        tableName: 'CartItems', // Explicitly set table name
        // Ensure that a product can only appear once in a given cart
        uniqueKeys: {
            ItemsInCartUnique: {
                fields: ['cartId', 'productId']
            }
        }
    });

    CartItem.associate = (models) => {
        CartItem.belongsTo(models.Cart, {
            foreignKey: 'cartId',
            as: 'cart'
        });
        CartItem.belongsTo(models.Product, {
            foreignKey: 'productId',
            as: 'product'
        });
    };

    return CartItem;
};