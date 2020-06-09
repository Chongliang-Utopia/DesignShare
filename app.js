require('dotenv').config();

var express     = require("express");
var app         = express();
var bodyParser  = require("body-parser");
var mongoose    = require("mongoose");
var	flash       = require("connect-flash");
var	passport    = require("passport");
var	LocalStrategy = require("passport-local");
var	methodOverride = require("method-override");
var DesignPiece  = require("./models/designPiece");
var	User        = require("./models/user");

//Requiring routes
var reviewRoutes     = require("./routes/reviews");
var	designPieceRoutes = require("./routes/designPieces");
var indexRoutes = require("./routes/index");

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
app.use("/designPieces", designPieceRoutes);
app.use("/designPieces/:id/reviews", reviewRoutes);


app.listen(process.env.PORT || 4000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});