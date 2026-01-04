// models/OrderDetail.js
module.exports = (sequelize, DataTypes) => {
    const OrderDetail = sequelize.define('OrderDetail', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Orders',
                key: 'id'
            }
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Products',
                key: 'id'
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            }
        }
    }, {
        timestamps: true,
        tableName: 'OrderDetails'
    });

    OrderDetail.associate = (models) => {
        OrderDetail.belongsTo(models.Order, {
            foreignKey: 'orderId',
            as: 'order',
            onDelete: 'CASCADE'
        });

        OrderDetail.belongsTo(models.Product, {
            foreignKey: 'productId',
            as: 'product',
            onDelete: 'RESTRICT'
        });
    };

    return OrderDetail;
};