const express = require('express');

const Album = require('../models/album');
const Auth = require("../config/auth");

const router = express.Router();


router.get('/', Auth.checkAuth, async function (req, res) {
	try {
		res.render('albums', {
			user: req.user,
			owner: req.user.login,
			canModify: true
		});
	} catch (err) {
		res.status(500);
		req.flash("error", "500\n Internal Server Error");
		res.redirect("/error");
	}


});

router.get('/new', Auth.checkAuth, function (req, res) {
	res.render('newAlbum', {
		message: req.flash("addAlbumError"),
		user: req.user
	});
});

router.get('/:id', Auth.checkAuth, async function (req, res) {

	const id = req.params.id;

	try {
		const album = await Album.getById(id).populate("author", "login");
		if (!album) {
			req.flash("error", "404\n Album is Not Found");
			res.redirect("/error");
			return;
		}

		res.render('album', {
			album,
			owner: album.author.login,
			user: req.user,
			canModify: album.author.login == req.user.login || req.user.role === "admin",
			adminRole: req.user.role === 'admin' && req.user.login !== album.author.login ? true : false
				
		});

	} catch (err) {
		res.status(500);
		req.flash("error", "500\n Internal Server Error");
		res.redirect("/error");
	}

});


router.get('/:id/new', Auth.checkAuth, async function (req, res) {
	try {

		let album = await Album.getById(req.params.id);
		if (!album) {

			res.status(404);
			req.flash("error", `404\n Album is not found`);
			res.redirect("/error");
		}
		else {

			if (album.author == req.user.id)
				res.render('newPicture', {
					album,
					user: req.user
				});

			else {
				res.status(403);
				req.flash("error", "403\n Forbidden");
				res.redirect("/error");
			}
		}
	}
	catch (err) {
		res.status(500);
		req.flash("error", "500\n Internal Server Error");
		res.redirect("/error");
	}
});

router.get('/:id/update', Auth.checkAuth, async function (req, res) {

	const id = req.params.id;

	const album = await Album.getById(id);
	if (!album) {
		req.flash("error", "404\n Album  is Not Found");
		res.redirect("/error");
	}
	else if (album.author != req.user.id) {
		req.flash("error", "403\n Forbidden");
		res.redirect("/error");
	}
	else res.render('updateAlbum', {
		album,
		user: req.user,
	});
});



module.exports = router;
