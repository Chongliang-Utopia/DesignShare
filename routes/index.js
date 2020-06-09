var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var DesignPiece = require("../models/designPiece");
var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);


//Root route
router.get("/", function(req, res){
    res.render("landing");
});


//Show register form
router.get("/register", function(req, res){
	res.render("register");
});

//Handle sign up logic
router.post("/register", function(req, res){
	
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || !data.length) {
		  req.flash('error', 'Invalid address');
		  return res.redirect('back');
		}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;
		var newUser = new User({username: req.body.username,
								firstName: req.body.firstName,
								lastName: req.body.lastName,
								email: req.body.email,
								avatar: req.body.avatar,
								location: location,
								lat: lat,
								lng: lng});
		if (req.body.adminCode === "secret"){
			newUser.isAdmin = true;
		}
		User.register(newUser, req.body.password, function(err, user){
			if (err){
				req.flash("error", err.message);
				return res.redirect("/register");
			}
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "Welcome, " + user.username);
				res.redirect("/designPieces");
			});
		});
	});
});

//Show login form
router.get("/login", function(req, res){
	res.render("login");
});
//Handing login logic
router.post("/login", passport.authenticate("local",
	{
	 successRedirect: "/designPieces",
	 failureRedirect: "/login"
	}), function(req, res){
});

//Logout Route
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged you out");
	res.redirect("/designPieces");
});

//User profile.
router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser) {
		if (err) {
			req.flash("error", "Something went wrong");
			res.redirect("/");
		}
		DesignPiece.find().where("author.id").equals(foundUser._id).exec(function(err, designPieces){
			if (err) {
				req.flash("error", "Something went wrong");
				res.redirect("/");
			}
			res.render("users/show", {user: foundUser, designPieces: designPieces});
		});
		
	})
});



module.exports = router;

