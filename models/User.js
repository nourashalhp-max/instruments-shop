// models/User.js
// Removed `const { DataTypes } = require('sequelize');` - it's passed as argument
module.exports = (sequelize, DataTypes) => { // <-- CRITICAL: Add DataTypes here
    const User = sequelize.define('User', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('user', 'admin'),
            defaultValue: 'user',
            allowNull: false
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // NEW: Shipping Address Fields
        shippingAddress: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        postalCode: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        country: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        }
    }, {
        timestamps: true, // Good practice to include
        tableName: 'Users' // Explicitly set table name
    });

    User.associate = (models) => {
        User.hasOne(models.Cart, {
            foreignKey: 'userId',
            as: 'cart',
            onDelete: 'CASCADE'
        });
        User.hasMany(models.Order, {
            foreignKey: 'userId',
            as: 'orders',
            onDelete: 'CASCADE'
        });
        User.hasMany(models.Review, { foreignKey: 'userId', as: 'reviews' });
    };

    return User;
};