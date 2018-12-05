const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const busboyBodyParser = require('busboy-body-parser');

const jwt = require('jsonwebtoken');


const router = express.Router();

router.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
router.use(bodyParser.json());
router.use(busboyBodyParser({ limit: '5mb' }));



router.get('/register', function (req, res) {
  res.render('register', {
    message: req.flash('signupMessage')
  });
});


router.post('/register', passport.authenticate('local-signup', {
  successRedirect: '/', // redirect to the secure profile section
  failureRedirect: "/auth/register", // redirect back to the signup page if there is an error
  failureFlash: true // allow flash messages
}));


router.get('/login', function (req, res) {
  res.render('login', { message:  req.flash('loginMessage')});
});

router.post(
  '/login',
  passport.authenticate('local-login', {
    successRedirect: '/', // redirect to the secure profile section
    failureRedirect: '/auth/login', // redirect back to the signup page if there is an error
    failureFlash: true, // allow flash messages
  })
);


router.get('/logout',  (req, res) => {
  req.logout();
  res.redirect('/');
});
module.exports = router;



