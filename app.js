require('dotenv').config();

var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
	flash       = require("connect-flash"),
	passport    = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
    Campground  = require("./models/campground"),
	User        = require("./models/user")
    // seedDB      = require("./seeds")

//Requiring routes
var reviewRoutes     = require("./routes/reviews"),
	campgroundRoutes = require("./routes/campgrounds"),
	indexRoutes = require("./routes/index")

// mongoose.connect("mongodb://localhost/yelp_camp_v3");
mongoose.connect("mongodb+srv://Chongliang:tcl900814@cluster0-2byrq.mongodb.net/test?retryWrites=true&w=majority", {
	useNewUrlParser: true,
	useCreateIndex: true
}).then(() => {
	console.log("connected to DB");
}).catch(err => {
	console.log('ERROR', err.message);
});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//Seed the database
// seedDB();

//Passport Configuration
app.use(require("express-session")({
	secret: "Today is Sunday",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);


//================================================================================================================
// var userIds = [];
// var itemIds = [];
// var purchases = [];
// var data = Campground.find({}, function(err, allCampgrounds){
// 	if(err){
// 		console.log(err);
// 	} else {
// 		// console.log(allCampgrounds);
// 		allCampgrounds.forEach((camp) => {
// 			userIds.push(`${camp.author.id}`);
// 			itemIds.push(`${camp._id}`);
// 			client.send(new rqs.AddPurchase(`${camp.author.id}`, `${camp._id}`, {cascadeCreate: true}));
// 		});
// 	}
// });


app.listen(process.env.PORT || 4000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});