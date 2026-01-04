// models/Cart.js
module.exports = (sequelize, DataTypes) => { // <-- CRITICAL: Add DataTypes here
    const Cart = sequelize.define('Cart', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users', // This refers to the table name 'Users'
                key: 'user_id'
            }
        },
        // You can add more fields if needed, e.g., 'createdAt', 'updatedAt' are automatic
    }, {
        timestamps: true,
        tableName: 'Carts' // Explicitly define table name
    });

    Cart.associate = (models) => {
        // A Cart belongs to a User
        Cart.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user', // Alias for association
            onDelete: 'CASCADE'
        });

        // A Cart has many CartItems
        Cart.hasMany(models.CartItem, {
            foreignKey: 'cartId',
            as: 'items', // Alias for association
            onDelete: 'CASCADE'
        });
    };

    return Cart;
};