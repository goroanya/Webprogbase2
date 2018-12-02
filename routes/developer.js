const express = require('express');


const router = express.Router();


router.get("/", function (req, res) {
  res.render('developer', {
    user: req.user,
    adminRole: req.user ? (req.user.role === 'admin' ? true : false) : false,
  });
});
module.exports = router;