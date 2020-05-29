var DesignPiece = require("../models/designPiece");
var Review = require("../models/review");
// All the middleware
var middlewareObj = {};

middlewareObj.checkDesignPieceOwnership = function(req, res, next){
	if (req.isAuthenticated()){
		// is user logged in?
		DesignPiece.findById(req.params.id, function(err, foundDesignPiece){
			if(err || !foundDesignPiece) {
				req.flash("error", "Campground not found");
				res.redirect("back");
			} else {
				if(foundDesignPiece.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}		
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
}


middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        DesignPiece.findById(req.params.id).populate("reviews").exec(function (err, foundDesignPiece) {
            if (err || !foundDesignPiece) {
                req.flash("error", "DesignPiece not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundDesignPiece.reviews
                var foundUserReview = foundDesignPiece.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/designPiece/" + foundDesignPiece._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
}

middlewareObj.isLogginIn= function(req, res, next) {
	if (req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
}

module.exports = middlewareObj;