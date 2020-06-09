var express = require("express");
var router = express.Router();
var DesignPiece = require("../models/designPiece");
var middleware = require("../middleware");
var Review = require("../models/review");
var NodeGeocoder = require('node-geocoder');
var User = require("../models/user");

//var client = new recombee.ApiClient('none111-dev', '8Hrr506FYrigZC01zdg3R4BC8xpdjcgScFX1KzkqVymZ5seaYw36eCe5rdredKHn');


//INDEX - show all DesignPiece
router.get("/", function(req, res){
	var noMatch;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		DesignPiece.find({name: regex}, function(err, allDesignPieces){
		   if(err){
			   console.log(err);
		   } else {
			  if (allDesignPieces.length < 1) {
				  var noMatch = "No designPiece match that query, please try again...";
			  }
			  res.render("designPieces/index",{designPieces:allDesignPieces, noMatch: noMatch});
		   }
		});
	} 
	else if (req.query.sort) {
		// sort all DesignPiece from DB
		DesignPiece.find({}).sort({ rating : -1}).exec(function(err, allDesignPieces){
		   if(err){
			   console.log(err);
		   } else {
			  res.render("designPieces/index",{designPieces:allDesignPieces, noMatch: noMatch});
		   }
		});
	}
	
	else if (req.query.filter) {
		if (req.query.filter == "graphic") {
			DesignPiece.find({category : "graphic"}, function(err, allDesignPieces){
			   if(err){
				   console.log(err);
			   } else {
				  res.render("designPieces/index",{designPieces:allDesignPieces, noMatch: noMatch});
			   }
			});
		} else if (req.query.filter == "UI") {
			DesignPiece.find({category : "UI"}, function(err, allDesignPieces){
			   if(err){
				   console.log(err);
			   } else {
				  res.render("designPieces/index",{designPieces:allDesignPieces, noMatch: noMatch});
			   }
			});
		}
	}
	
	else {
		// Get all DesignPiece from DB
		DesignPiece.find({}, function(err, allDesignPieces){
		   if(err){
			   console.log(err);
		   } else {
			  res.render("designPieces/index",{designPieces:allDesignPieces, noMatch: noMatch});
		   }
		});
	}
});

//CREATE - add new designPiece to DB
router.post("/", middleware.isLogginIn, function(req, res){
  // get data from form and add to designPieces array
  var name = req.body.name;
  var image = req.body.image;
  var price = req.body.price;
  var desc = req.body.description;
  var category = req.body.category;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
    var newDesignPiece = {name: name, image: image, price: price, description: desc, category: category, author:author};
    // Create a new designPiece and save to DB
    DesignPiece.create(newDesignPiece, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to designPieces page
            console.log(newlyCreated);	
            res.redirect("/designPieces");
        }
  });
});

//NEW - show form to create new designPiece
router.get("/new", middleware.isLogginIn, function(req, res){
   res.render("designPieces/new"); 
});

// SHOW - shows more info about one designPiece
router.get("/:id", function (req, res) {
    //find the designPiece with provided ID
    DesignPiece.findById(req.params.id).populate("comments likes").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundDesignPiece) {
        if (err || !foundDesignPiece) {
            console.log(err);
        } else {
			User.findById(foundDesignPiece.author.id, function(err, user) {
				if (err) {
					console.log(err);
				} else {
					res.render("designPieces/show", {designPiece: foundDesignPiece, user: user});
				}
			})
        }
    });
});

// EDIT designPiece route
router.get("/:id/edit", middleware.checkDesignPieceOwnership, function(req, res){
	DesignPiece.findById(req.params.id, function(err, foundDesignPiece){
		if (err) {
			req.flash("error", "DesignPiece not found");
			res.redirect("/designPieces");
		} else {	
			res.render("designPieces/edit", {designPiece: foundDesignPiece});
		}
	});
});

// UPDATE DesignPiece ROUTE
router.put("/:id", middleware.checkDesignPieceOwnership, function(req, res){

    DesignPiece.findByIdAndUpdate(req.params.id, req.body.designPiece, function(err, designPiece){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/designPieces/" + designPiece._id);
        }
    });
});

// DESTROY DesignPiece ROUTE
router.delete("/:id", middleware.checkDesignPieceOwnership, function (req, res) {
    DesignPiece.findById(req.params.id, function (err, designPiece) {
        if (err) {
            res.redirect("/designPieces");
        } else {
                // deletes all reviews associated with the DesignPiece
                Review.remove({"_id": {$in: designPiece.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/designPieces");
                    }
                    //  delete the DesignPiece
                    designPiece.remove();
                    req.flash("success", "designPiece deleted successfully!");
                    res.redirect("/designPieces");
                });
        }
    });
});

// designPiece Like Route
router.post("/:id/like", middleware.isLogginIn, function (req, res) {
    DesignPiece.findById(req.params.id, function (err, foundDesignPiece) {
        if (err) {
            console.log(err);
            return res.redirect("/designPieces");
        }

        // check if req.user._id exists in foundDesignPiece.likes
        var foundUserLike = foundDesignPiece.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundDesignPiece.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundDesignPiece.likes.push(req.user);
        }

        foundDesignPiece.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/designPieces");
            }
            return res.redirect("/designPieces/" + foundDesignPiece._id);
        });
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;
