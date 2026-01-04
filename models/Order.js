// models/Order.js
// Removed `const { DataTypes } = require('sequelize');` - it's passed as argument
module.exports = (sequelize, DataTypes) => { // <-- CRITICAL: Add DataTypes here
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'user_id'
            }
        },
        orderDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2), // Use DECIMAL for precision
            allowNull: false,
        },
        status: { // e.g., 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Pending',
        },
        // NEW: Shipping details from checkout form
        shippingAddress: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        postalCode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        country: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        paymentMethod: { // e.g., 'COD', 'Credit Card', 'PayPal'
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'COD'
        },
        deliveryLocation: { // Specific notes for delivery location
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null
        }
    }, {
        timestamps: true, // Good practice to include
        tableName: 'Orders' // Explicitly set table name
    });

    Order.associate = (models) => {
        Order.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
            onDelete: 'CASCADE'
        });
        Order.hasMany(models.OrderDetail, {
            foreignKey: 'orderId',
            as: 'details',
            onDelete: 'CASCADE'
        });
    };

    return Order;
};