const express = require("express");
var bodyParser = require("body-parser");
const { ObjectID } = require("mongodb");
var session = require('express-session');
const _ = require("lodash");
const { mongoose } = require("./db/mongoose");
const { users } = require("./models/users");
const { posts } = require("./models/posts");
var { authenticate } = require("./middleware/authenticate");
import axios from "axios";
const expressValidator = require('express-validator');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const { mySecret } = require("./secret/secretFile");

// Create express router
const router = express.Router();

// Transform req & res to have the same API as express
// So we can use res.status() & res.json()
const app = express();
app.use(cookieParser());
//app.use('/authroute', authroute);

router.use((req, res, next) => {
  Object.setPrototypeOf(req, app.request);
  Object.setPrototypeOf(res, app.response);
  req.res = res;
  res.req = req;
  next();
});

//get email
app.post("/login", (req, res) => {
  var body = _.pick(req.body, ["username", "password"]);
  users
    .findByCredentials(body.username, body.password)
    .then(user => {
      user.generateAuthToken().then(token => {
        req.session.authUser = { userId: token };
        // res.cookie('sessionToken', token, {maxAge: 9000000});
        return res.json({
              userId: token,
              fullName: user.fullName,
              phone: user.contact[0]
              });
    })
    })

    .catch(e => {
      res.status(401).send();
    });
});

// Add POST - /api/logout
app.post("/logout", (req, res) => {

  users.findOne({'tokens.token':req.body.token}).then((user)=>{
    user.loginFlag = false;
    user.save();
  }).catch((e)=>{
      res.status(401).send();
  });

  delete req.session.authUser;
 
  res.json({ ok: true });
});

app.post("/signup", (req, res) => {
  var body = _.pick(req.body, [
    "fullName",
    "password",
    "contact",
    "gender",
    "zipCode",
    "OTPtoken"
  ]);
  body.createdAt = new Date();
  if(body.OTPtoken == req.session.OtpToken){
    var newUser = new users(body);
    newUser
        .save()
        .then(() => {
          return newUser.generateAuthToken();
        })
        .then(token => {
          req.session.authUser = { userId: token };
          return res.json({
            userId: token,
            fullName: newUser.fullName,
            phoneNumber: newUser.phoneNumber
          });
        })
        .catch(e => {
          res.status(400).send(e);
        });
  }else{
    res.send("You are not allowed to register")
  }
});

// Export the server middleware
app.get("/profile", (req, res) => {
  res.send("You have logged in");
});

//put your own apikey and secret in the blanks in nexmo object
app.post("/sendOTP", (req, res) => {
//  console.log(req.body.phoneNumber);
users.findOne({contact:req.body.phoneNumber}).then((currentUser)=>{
  if(!currentUser){
    var token = jwt.sign({ foo: 'bar' }, 'shhhhh');
   // console.log(token)
    req.session.OTPtoken = token
   // console.log(req.session.OTPtoken)
    var nexmoSend = {
      api_key: "enter your own api_key"
      api_secret: "enter your own api_secret",
      number: req.body.phoneNumber,
      brand: "NexmoVerifyTest"
    };
    axios
        .post("https://api.nexmo.com/verify/json", nexmoSend)
        .then(response => {
          res.send(response.data);
        })
        .catch(err => {
          res.status(401).send("Error sending OTP");
        });
  }else {
    res.status(401).send('User Already Exists')
  }
})

});

app.post("/verifyOTP", (req, res) => {
//  console.log(req.body.code);
 // console.log(req.body.request_id);

  var nexmoSend = {
    api_key: "enter your own api_key",
    api_secret: "enter your own api_secret",
    request_id: req.body.request_id,
    code: req.body.code
  };
  axios
    .post("https://api.nexmo.com/verify/check/json", nexmoSend)
    .then(response => {
      res.send({resp:response.data, token:req.session.OTPtoken});
    })
    .catch(err => {
      res.status(401).send("Error sending OTP");
    });
});



app.get('/landing', (req, res)=>{
  posts.find({ })
  .then((postsData)=>{
    return res.json ({postsData});
  })
  .catch((err)=>{
    console.log(err);
  })

});
app.post('/newpost',(req, res)=>{
  var Token = req.header('Token');
        decoded = jwt.verify(Token, 'abc123', (err)=>{
          if (!err){
            var newPost = new posts();
          newPost.authorName = req.body.authorName;
          newPost.postTitle = req.body.title;
          newPost.postDescription = req.body.description;
          newPost.postedDate = req.body.postedOn;
          newPost.save(()=>{
            return res.status(200).send();
          })
          }else{
            return res.status(401).send();
          }
        })
        
    })





export default {
  path: "/api",
  handler: app
};
