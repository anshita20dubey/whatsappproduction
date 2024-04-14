var express = require('express');
var router = express.Router();
const users = require('../Model/user');
const db = require('../db');
// const users = require('./users')
var passport = require('passport')
var localStrategy = require('passport-local')
passport.use(new localStrategy(users.authenticate()));

/* GET home page. */
router.get('/', isloggedIn, async function (req, res, next) {
  const loggedInUser = req.user;
  res.render('index',{loggedInUser});
});

router.post('/register', (req, res, next) => {
  var newUser = {
    username: req.body.username
  };
  users.register(newUser, req.body.password).then((result) => {
      passport.authenticate('local')(req, res, () => {
        //destination after user register
        res.redirect('/');
      });
    }).catch((err) => {
      res.send(err);
    });
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
}),
  (req, res, next) => { }
);

router.get('/register',function(req,res,next){
  res.render('register');
});

router.get('/login',function(req,res,next){
  res.render('login');
})

function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  else res.redirect('/login');
};

router.get('/logout', (req, res, next) => {
  if (req.isAuthenticated())
    req.logout((err) => {
      if (err) res.send(err);
      else res.redirect('/');
    });
  else {
    res.redirect('/');
  }
});


module.exports = router;
