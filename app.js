require('dotenv').config()
const { urlencoded } = require("express")
const express = require("express")
const app = express()
const mongoose = require("mongoose")
const encrypt = require("mongoose-encryption")

app.use(express.static("public"))
app.use(urlencoded({extended: true}))
app.set("view engine", "ejs")

mongoose.connect("mongodb://localhost:27017/secretDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]})

const User = mongoose.model("User", userSchema)

app.get("/", function(req, res){
    res.render("home")
})

app.get("/login", function(req, res){
    res.render("login")
})

app.get("/register", function(req, res){
    res.render("register")
})

app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.email,
        password: req.body.password
    })
    newUser.save(function(err){
        if (err){
            console.log(err)
        } else {
            res.render("secrets")
        }
    })
})

app.post("/login", function(req, res){
    const email = req.body.email
    const password = req.body.password

    User.findOne({email: email}, function(err, foundUser){
        if (foundUser){
            if (foundUser.password === password){
                res.render("secrets")
            }
        }
    })
})




let port = process.env.PORT
if (port == null || port == ""){
    port = 3000
}
app.listen(port, function(){
    console.log("Server has started on port 3000")
})
