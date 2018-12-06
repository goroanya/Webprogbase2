const express = require('express');
const Picture = require('../models/picture');

const Auth = require("../config/auth");
const router = express.Router();

module.exports = router;

router.get("/new", Auth.checkAuth, (req, res) => {
	res.render('newPicture', {
		user: req.user
	});
});

router.get('/:id', Auth.checkAuth, async function (req, res) {
	const id = req.params.id;
	try {
		const pic = await Picture.getById(id).populate('author', 'login').populate('album', 'name');

		if (!pic) {
			req.flash("error", "404 picture is not found");
			res.redirect("/error");
			return;
		}
		res.render('picture', {
			picture: pic,
			user: req.user,
			canModify: pic.author.login == req.user.login || req.user.role === "admin",
			adminRole: req.user.role === 'admin' && req.user.login !== pic.author.login ? true : false

		});
	} catch (err) {
		res.status(500);
		req.flash("error", "500\n Internal Server Error");
		res.redirect("/error");
	}
});


router.get('/:id/update', Auth.checkAuth, async function (req, res) {
	try {
		const pic = await Picture.getById(req.params.id).populate('album');

		if (pic.author != req.user.id) {

			req.flash("error", "403\n Forbidden");
			res.redirect("/error");
		} else {

			res.render('updatePicture', {
				pic,
				user: req.user
			});
		}
	} catch (err) {

		req.flash("error", "500\n Internal Server Error");
		res.redirect("/error");
	}
});

