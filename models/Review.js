module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define('Review', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 3 }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'Reviews',
        timestamps: true
    });

    Review.associate = (models) => {
        // A review belongs to a user
        Review.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        // A review belongs to a product
        Review.belongsTo(models.Product, {
            foreignKey: 'productId',
            as: 'product'
        });
    };

    return Review;
};