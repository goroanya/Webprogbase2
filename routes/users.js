const express = require('express');
const User = require('../models/user');
const Auth = require("../config/auth");

const router = express.Router();

router.get('/', Auth.checkAuth, async function (req, res) {
  try {

    res.render('users', { user: req.user, adminRole: req.user ? (req.user.role === 'admin' ? true : false) : false });
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
      req.flash("error", "404 User is not found");
      res.redirect('/error');
      return;
    }
    res.render('user', {
      userProfile: user,
      user: req.user,
      canModify: user.login == req.user.login,
      adminRole: req.user ? (req.user.role === 'admin' ? true : false) : false
    });

  }
  catch (err) {
    req.flash("error", "500\n Internal Server Error");
    res.redirect("/error");
  }
});

router.get('/:login/albums', Auth.checkAuth, async function (req, res) {
  const login = req.params.login;

  res.render('albums', {
    user: req.user,
    owner: req.params.login,
    canModify: login == req.user.login,
    adminRole: req.user
      ? req.user.role === 'admin' ? true : false
      : false

  });
});


router.get('/:login/stories', Auth.checkAuth, function (req, res) {

  res.render('stories', {
    owner: req.params.login,
    user: req.user
  });
});

router.get("/:login/update", Auth.checkAuth, async function (req, res) {


  const login = req.params.login;
  if (login != req.user.login) {
    req.flash("error", "403 Forbidden");
    res.redirect("/error");
    return;
  }
  try {

    const user = await User.getByLogin(login);
    if (!user) {
      req.flash("error", "404\n User Not Found");
      return;
    }
    res.render('updateUser', {
      userProfile: user,
      user: req.user
    });

  }
  catch (err) {
    req.flash("error", "500\n Internal Server Error");
    res.redirect("/error");
  }
});


module.exports = router;
