const express = require('express');
const Picture = require('../models/picture');
const Auth = require("../config/auth");
const router = express.Router();

module.exports = router;

router.get('/page/:short_name', Auth.checkAuth, async function (req, res) {
	const short_name = req.params.short_name;
	try {
		const pic = await Picture.getByShortName(short_name).populate('author').populate('album', 'name');

		res.render('picture', {
			picture: pic,
			user: req.user,
			adminRole: req.user
				? req.user.role === 'admin' ? true : false
				: false,
		});
	} catch (err) {
		res.status(500);
		req.flash("error", "500\n Internal Server Error");
		res.redirect("/error");
	}
});


router.get('/:short_name/update', Auth.checkAuth, async function (req, res) {
	try {
		const pic = await Picture.getByShortName(req.params.short_name).populate('album');

		if (pic.author != req.user.id) {

			req.flash("error", "403\n Forbidden");
			res.redirect("/error");
		} else {

			res.render('updatePicture', {
				pic,
				user: req.user,
				adminRole: req.user
					? req.user.role === 'admin' ? true : false
					: false,
			});
		}
	} catch (err) {
		req.flash("error", "500\n Internal Server Error");
		res.redirect("/error");
	}
});
