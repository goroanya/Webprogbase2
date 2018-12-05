const express = require('express');


const router = express.Router();


router.get("/", function (req, res) {
  res.render('developer', {
    user: req.user
  });
});
module.exports = router;