const express = require('express');
const User = require('../models/user');
const Auth = require("../config/auth");

const router = express.Router();

router.get('/', Auth.checkAdmin, async function (req, res) {
  try {
    const users = await User.getAll();

    for (let user of users) {
      if (user.role === "admin") {
        user.admin = true;
      }
    }
    res.render('users', { users, user: req.user, adminRole: req.user ? (req.user.role === 'admin' ? true : false) : false });
  } catch (err) {
    req.flash("error", "500\n Internal Server Error");
    res.redirect("/error");
  }
});

router.get('/:login', Auth.checkAuth, async function (req, res) {
  const login = req.params.login;
  try {

    const user = await User.getByLogin(login);
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

router.post("/:login/updateRole", Auth.checkAdmin, async function (req, res) {
  const login = req.params.login;
  const role = req.body.role;
  try {
    await User.updateRole(login, role);
    res.redirect(`/users/${login}`);
  }
  catch (err) {
    req.flash("error", "500\n Internal Server Error");
    res.redirect("/error");
  }

});

module.exports = router;
