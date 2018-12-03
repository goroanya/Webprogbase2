const express = require('express');
const User = require('../models/user');
const Auth = require("../config/auth");

const router = express.Router();

router.get('/', Auth.checkAuth, async function (req, res) {
  try {
    
    res.render('users', {  user: req.user, adminRole: req.user ? (req.user.role === 'admin' ? true : false) : false });
  } catch (err) {
    req.flash("error", "500\n Internal Server Error");
    res.redirect("/error");
  }
});

router.get('/:login', Auth.checkAuth, async function (req, res) {
  const login = req.params.login;
  try {

    const user = await User.getByLogin(login).populate('tempPhotos');
    if (!user) {
      req.flash("error", "404\n User Not Found");
      return;
    }
    res.render('user', {
      userProfile: user,
      user: req.user,
      adminRole: req.user ? (req.user.role === 'admin' ? true : false) : false
    });

  }
  catch (err) {
    req.flash("error", "500\n Internal Server Error");
    res.redirect("/error");
  }
});


module.exports = router;
