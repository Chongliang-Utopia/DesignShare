var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var Review = require("../models/review");
var NodeGeocoder = require('node-geocoder');

//var client = new recombee.ApiClient('none111-dev', '8Hrr506FYrigZC01zdg3R4BC8xpdjcgScFX1KzkqVymZ5seaYw36eCe5rdredKHn');


//INDEX - show all campgrounds
router.get("/", function(req, res){
	var noMatch;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campground.find({name: regex}, function(err, allCampgrounds){
		   if(err){
			   console.log(err);
		   } else {
			  if (allCampgrounds.length < 1) {
				  var noMatch = "No campgrunds match that query, please try again...";
			  }
			  res.render("campgrounds/index",{campgrounds:allCampgrounds, noMatch: noMatch});
		   }
		});
	} 
	
	else {
		// Get all campgrounds from DB
		Campground.find({}, function(err, allCampgrounds){
		   if(err){
			   console.log(err);
		   } else {
			  res.render("campgrounds/index",{campgrounds:allCampgrounds, noMatch: noMatch});
		   }
		});
	}
});

//CREATE - add new campground to DB
router.post("/", middleware.isLogginIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var price = req.body.price;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
    var newCampground = {name: name, image: image, price: price, description: desc, author:author};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);	
            res.redirect("/campgrounds");
        }
  });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLogginIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function (req, res) {
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments likes").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            console.log(err);
        } else {
			//===============================================================
			// client.send(new rqs.AddDetailView(`${foundCampground.author.id}`, `${foundCampground._id}`, {cascadeCreate: true}), function(err, res){
			// 	if (err) {
			// 		console.log(err);
			// 	} else {
			// 	}
			// });
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT campground route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		if (err) {
			req.flash("error", "Campground not found");
			res.redirect("/campgrounds");
		} else {	
			res.render("campgrounds/edit", {campground: foundCampground});
		}
	});
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
                // deletes all reviews associated with the campground
                Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    //  delete the campground
                    campground.remove();
                    req.flash("success", "Campground deleted successfully!");
                    res.redirect("/campgrounds");
                });
        }
    });
});

// Campground Like Route
router.post("/:id/like", middleware.isLogginIn, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
        }

        // check if req.user._id exists in foundCampground.likes
        var foundUserLike = foundCampground.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundCampground.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundCampground.likes.push(req.user);
        }

        foundCampground.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/campgrounds");
            }
            return res.redirect("/campgrounds/" + foundCampground._id);
        });
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
