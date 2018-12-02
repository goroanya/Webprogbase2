const express = require('express');
const Picture = require('../models/picture');
const Auth = require("../config/auth");
const router = express.Router();

module.exports = router;

router.get('/page/:short_name', Auth.checkAuth, async function (req, res) {
	const short_name = req.params.short_name;
	try {
		const pic = await Picture.getByShortName(short_name).populate('author').populate('album', 'name');

		if (pic.author.id == req.user.id || req.user.role === "admin")
			res.render('picture', {
				picture: pic,
				user: req.user,
				adminRole: req.user
					? req.user.role === 'admin' ? true : false
					: false,
			});
		else {
			res.status(403);
			req.flash("error", "403\n Forbidden");
			res.redirect("/error");
		}
	} catch (err) {
		res.status(500);
		req.flash("error", "500\n Internal Server Error");
		res.redirect("/error");
	}
});

router.post('/:short_name/delete', Auth.checkAuth, async function (req, res) {
	try {
		const picture = await Picture.getByShortName(req.params.short_name);

		if (!picture) {
			req.flash("error", "404\n Picture is Not Found");
			res.redirect("/error");
		}
		else if (picture.author != req.user.id && req.user.role !== "admin") {
			req.flash("error", "403\n Forbidden");
			res.redirect("/error");
		} else {
			const deleted = await Picture.delete(req.params.short_name);
			res.redirect('/albums/' + deleted.album.name);
		}


	} catch (err) {
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

			const data = {
				update: true,
				pic,
				user: req.user,
				message: req.flash("updatePicError"),
				adminRole: req.user
					? req.user.role === 'admin' ? true : false
					: false,
			};

			res.render('updatePicture', data);
		}
	} catch (err) {
		req.flash("error", "500\n Internal Server Error");
		res.redirect("/error");
	}
});
