const db = require('../models');
const Review = db.Review;

exports.createReview = async (req, res) => {
    // Correctly define productId at the top level of the function
    const productId = req.params.productId || req.params.id; 
    
    try {
        const { rating, comment } = req.body;
        const userId = req.user.user_id; 

        if (!productId) {
            throw new Error("Missing Product ID");
        }

        await Review.create({
            rating: parseInt(rating),
            comment: comment,
            productId: parseInt(productId),
            userId: userId
        });

        req.flash('success', 'Thank you for your review!');
        res.redirect(`/products/${productId}`);
    } catch (error) {
        console.error("Error creating review:", error);
        req.flash('error', 'Could not post review.');
        
        // productId is now defined, so this won't cause a ReferenceError anymore
        if (productId) {
            res.redirect(`/products/${productId}`);
        } else {
            res.redirect('/products');
        }
    }
};