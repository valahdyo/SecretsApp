require('dotenv').config()
const express = require("express")
const app = express()
const mongoose = require("mongoose")
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const FacebookStrategy = require("passport-facebook").Strategy
const findOrCreate = require("mongoose-findorcreate")
const { urlencoded } = require('express')

app.use(express.static("public"))
app.use(urlencoded({extended: true}))
app.set("view engine", "ejs")

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/secretDB")


const User = mongoose.model("User", new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String
}).plugin(passportLocalMongoose).plugin(findOrCreate))

passport.use(User.createStrategy())
passport.serializeUser(function(user, done) {
    done(null, user.id)
  })
passport.deserializeUser(function(id, done) {
   User.findById(id, function(err, user) {
     done(err, user)
   })
})

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user)
    })
  }
))

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home")
})

app.get('/auth/google', passport.authenticate("google", { scope: ["profile"] }))

app.get('/auth/google/secrets', 
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
    res.redirect("/secrets");
})

app.get("/auth/facebook", passport.authenticate("facebook", {scope: ["public_profile"]}))

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });

app.get("/login", function(req, res){
    res.render("login")
})

app.get("/register", function(req, res){
    res.render("register")
})

app.post("/register", function(req, res){
   const {username, password} = req.body

   User.register({username: username}, password, function(err, user){
       if (err){
           console.log(err)
           res.redirect("/register")
       } else {
           req.login(user, function(err){
               if (err){
                   return next(err)
               } return res.redirect("/secrets")
           })
       }
   })
})

app.post("/login",passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/secrets"
}))

    

app.get("/secrets", function(req, res){
    res.set(
        'Cache-Control', 
        'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
    );
    if (req.isAuthenticated()){
        res.render("secrets")
    } else {
        res.redirect("/login")
    }
})

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
})


let port = process.env.PORT
if (port == null || port == ""){
    port = 3000
}
app.listen(port, function(){
    console.log("Server has started on port 3000")
})
