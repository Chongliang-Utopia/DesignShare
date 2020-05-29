var express = require("express");
var router = express.Router({mergeParams: true});
var DesignPiece = require("../models/designPiece");
var Review = require("../models/review");
var middleware = require("../middleware");

// Reviews Index
router.get("/", function (req, res) {
    DesignPiece.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).exec(function (err, designPiece) {
        if (err || !designPiece) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {designPiece: designPiece});
    });
});

// Reviews New
router.get("/new", middleware.isLogginIn, middleware.checkReviewExistence, function (req, res) {
    // middleware.checkReviewExistence checks if a user already reviewed the designPiece, only one review per user is allowed
    DesignPiece.findById(req.params.id, function (err, designPiece) {
        if (err || !designPiece) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", {designPiece: designPiece});

    });
});

// Reviews Create
router.post("/", middleware.isLogginIn, middleware.checkReviewExistence, function (req, res) {
    //lookup designPiece using ID
    DesignPiece.findById(req.params.id).populate("reviews").exec(function (err, designPiece) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated designPiece to the review
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.designPiece = designPiece;
            //save review
            review.save();
            designPiece.reviews.push(review);
            // calculate the new average review for the designPiece
            designPiece.rating = calculateAverage(designPiece.reviews);
            //save designPiece
            designPiece.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/designPieces/' + designPiece._id);
        });
    });
});

// Reviews Edit
router.get("/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit", {designPiece_id: req.params.id, review: foundReview});
    });
});

// Reviews Update
router.put("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        DesignPiece.findById(req.params.id).populate("reviews").exec(function (err, designPiece) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate designPiece average
            designPiece.rating = calculateAverage(designPiece.reviews);
            //save changes
            designPiece.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/designPieces/' + designPiece._id);
        });
    });
});

// Reviews Delete
router.delete("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        DesignPiece.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function (err, designPiece) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate designPiece average
            designPiece.rating = calculateAverage(designPiece.reviews);
            //save changes
            designPiece.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/designPieces/" + req.params.id);
        });
    });
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;