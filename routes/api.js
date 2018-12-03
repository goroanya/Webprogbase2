const express = require('express');
const bodyParser = require('body-parser');
const busboyBodyParser = require('busboy-body-parser');
const passport = require('passport');

let prettydate = require("pretty-date");

const Auth = require("../config/auth");
const Hash = require("../config/hash");
const User = require('../models/user');
const Album = require('../models/album');
const Picture = require('../models/picture');

function authorize(req, res, next) {
    if (req.user) return next();

    passport.authenticate('basic', { session: false }, (err, user) => {
        if (err || !user) return res.sendStatus(401);
        req.login(user, { session: false }, (err) => {
            if (err) return res.sendStatus(401);
            next();
        });
    })(req, res);
}
require('dotenv').config();

const Pagination = require("../config/pagination");

require("../modules/passport");


const router = express.Router();

router.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
router.use(bodyParser.json());
router.use(busboyBodyParser({ limit: '5mb' }));


router.get("/", function (req, res) {
    res.status(200).json({ message: "Hello!" });
});

//-----------------------------------------------USERS-----------------------------------------------------
router.get('/me', authorize, function (req, res) {
    res.status(200).json(req.user);
});

router.get("/users", authorize, Auth.checkAdminAPI, async function (req, res) {
    try {
        let users = await User.getAll();
        users = Pagination(users, parseInt(req.query.page) || 1, parseInt(req.query.offset) || 3).entities;

        res.status(200).json(users);

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/users/:login", authorize, Auth.checkAdminAPI, async function (req, res) {

    try {
        const user = await User.getByLogin(req.params.login);
        if (!user) res.status(404).json({ message: "User with this login is not found", login: req.params.login });
        else res.status(200).json(user);

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }


});

router.delete("/users/:login", authorize, Auth.checkAdminAPI, async function (req, res) {

    try {
        const user = await User.deleteByLogin(req.params.login);
        if (!user) res.status(404).json({ message: "User with this login is not found", login: req.params.login });
        else res.status(200).json({ message: `User with login: ${req.params.login} is deleted` });

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }

});

router.put("/users/:login", authorize, Auth.checkAdminAPI, async function (req, res) {

    if (!req.body.fullname && !req.body.role && !req.body.avaUrl && !req.body.password) {
        res.status(400).json({ message: " No one field is  specified" });
        return;
    }
    try {
        const updated = await User.update(req.params.login, {
            fullname: req.body.fullname,
            role: req.body.role,
            avaUrl: req.body.avaUrl,
            password: req.body.password ? Hash.sha512(req.body.password, process.env.SALT).passwordHash : null
        });
        if (!updated) res.status(404).json({ message: "User with this login is not found", login: req.params.login });
        else res.status(200).json(updated);

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }


});

//-----------------------------------------------ALBUMS-----------------------------------------------------

router.get("/albums", authorize, async function (req, res) {

    try {

        let data = Pagination(await Album.getAllLength(req.user), parseInt(req.query.page) || 1, parseInt(req.query.offset) || 3);

        let albums = await Album.getAll(req.user, parseInt(req.query.page) || 1, parseInt(req.query.offset) || 3);
        data.albums = albums.docs;

        res.status(200).json(data);

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }


});


router.post("/albums", authorize, Auth.checkAuthAPI, async function (req, res) {

    const name = req.body.name;

    if (!name) { res.status(400).json({ message: "Field \"name\" is not specified" }); return; }

    if (/\s/.test(name)) {
        res.status(400).json({ message: "Field \"name\" must not contain spaces!" }); return;
    }
    const album = new Album(name, req.user, []);

    try {

        const newAlbum = await Album.insert(album);
        res.status(201).json(newAlbum);

    } catch (err) {
        res.status(400).send({ message: err });
    }
});

router.get("/albums/:album_name", authorize, Auth.checkAuthAPI, async function (req, res) {

    try {

        let album = await Album.getByName(req.params.album_name).populate("photos");

        if (!album) { res.status(404).json({ message: " 404 \n Album  is not found" }); return; }

        if (req.user.id == album.author || req.user.role === "admin") {


            let searchByShortName = req.query.name;

            if (searchByShortName && searchByShortName !== "") {

                let foundArray = [];
                for (let photo of album.photos) {
                    if (photo.short_name.toLowerCase().indexOf(searchByShortName.toLowerCase()) !== -1) foundArray.push(photo);
                }
                if (!foundArray.length) { res.status(404).json({ album, request: searchByShortName, message: `Nothing found by request : ${searchByShortName}` }); }
                else {

                    res.status(200).json({ album, foundArray, request: searchByShortName });
                }

            } else {

                res.status(200).json({ album });
            }

        } else res.status(403).json({ message: " 403 \n Forbidden" });

    } catch (err) {
        res.status(500).json({ message: "500 \n Internal server error" });
    }
});

router.delete("/albums/:album_name", authorize, Auth.checkAuthAPI, async function (req, res) {
    try {
        const album = await Album.getByName(req.params.album_name);

        if (!album) res.status(404).json({ message: "Album  is not found" });
        else if (album.author != req.user.id && req.user.role !== "admin") res.status(403).json({ message: "Forbiden" });
        else res.status(200).json(await Album.delete(req.params.album_name));

    }
    catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});


router.put("/albums/:album_name", authorize, Auth.checkAuthAPI, async function (req, res) {

    if (!req.body.name) { res.status(404).json({ message: "Field \"name\" is not specified" }); return; }

    if (/\s/.test(req.body.name)) {
        res.status(400).json({ message: "Field \"name\" must not contain spaces!" }); return;
    }
    try {
        const oldName = req.params.album_name;
        const newName = req.body.name;

        const album = await Album.getByName(oldName);
        if (!album) {
            res.status(404).json({ message: "Album with this name is not found", name: oldName });
        }
        else if (album.author != req.user.id) {
            res.status(404).json({ message: "Forbidden" });
        }
        else {
            const updated = await Album.update(oldName, newName);
            res.status(200).json(updated);
        }


    } catch (err) {
        res.status(400).send({ message: err });
    }

});




//-----------------------------------------------PICTURES-----------------------------------------------------
router.get("/photos", authorize, Auth.checkAuthAPI, async function (req, res) {

    try {

        if (req.query.filter && req.query.album) {
            let foundArray = await Picture.getAllFiltered(req.query.album, req.query.filter, parseInt(req.query.page) || 1, parseInt(req.query.offset || 3));

            if (!foundArray.length) { res.status(404).json({ request: req.query.filter, message: `Nothing found by request : ${req.query.filter}` }); }
            else {

                res.status(200).json({ photos: foundArray, request: req.query.filter });
            }
        }
        else {
            let photos = req.query.album
                ? (await Picture.getAllInAlbum(req.query.album, parseInt(req.query.page) || 1, parseInt(req.query.offset) || 3)).docs
                : (await Picture.getAll(req.user, parseInt(req.query.page) || 1, parseInt(req.query.offset) || 3)).docs;


            for (let photo of photos) {
                //todo
                photo.prettydate = prettydate.format(new Date(photo.createdAt));
            }
         

            

            res.status(200).json({ photos });
        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }

});
router.post("/photos", authorize, Auth.checkAuthAPI, async function (req, res) {
    try {

        const url = req.body.url;
        const description = req.body.description;
        const short_name = req.body.name;
        const album_name = req.body.album;

        if (!short_name) { res.status(400).json({ message: `Field (name) is not specified` }); return; }
        else if (!url) { res.status(400).json({ message: `Field (url) is not specified` }); return; }


        if (/\s/.test(short_name)) {
            res.status(400).json({ message: "Field \"name\" must not contain spaces!" }); return;
        }

        const saved = await Picture.insert(new Picture(true, short_name, album_name, description, url, req.user, Date.now()));

        if (saved === 403) { res.status(403).json({ message: "Forbidden" }); }
        else res.status(201).json(saved);

    } catch (err) {
        res.status(400).json({ message: err });
    }
});
router.get("/photos/:name", authorize, Auth.checkAuthAPI, async function (req, res) {
    const name = req.params.name;
    try {
        const pic = await Picture.getByShortName(name).populate('author', "login").populate("author", 'login').populate("album", "name");

        if (!pic) {
            res.status(404).json({ message: `Picture with  name ${name} is not found` });
            return;
        }
        if (pic.author.id == req.user.id || req.user.role === "admin") {
            //pic.createdAt = prettydate.format(new Date(pic.createdAt));
            res.status(200).json(pic);
        }
        else {

            res.status(403).json({ message: "Forbidden" });

        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });

    }
});
router.delete("/photos/:name", authorize, Auth.checkAuthAPI, async function (req, res) {
    const name = req.params.name;
    try {
        const pic = await Picture.getByShortName(name).populate('author', "login").populate("author", 'login').populate("album", "name");

        if (!pic) {
            res.status(404).json({ message: "Picture with this name is not found", name });
            return;
        }
        if (pic.author.id == req.user.id || req.user.role === "admin") {

            const deleted = await Picture.delete(name);
            res.status(200).json(deleted);
        }


        else {
            res.status(403).json({ message: "Forbidden" });

        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});
router.put("/photos/:name", authorize, Auth.checkAuthAPI, async function (req, res) {

    if (!req.body.name && !req.body.description) { res.status(400).send({ message: "No specified field" }); }

    if (/\s/.test(req.body.name)) {
        res.status(400).json({ message: "Field \"name\" must not contain spaces!" }); return;
    }

    const name = req.params.name;
    try {
        let picture = await Picture.getByShortName(name);
        if (!picture) {
            res.status(404).json({ message: "Picture is not found" });
            return;
        }
        let toupd = { short_name: req.body.name, description: req.body.description, author: req.user };

        const result = await Picture.update(picture.id, toupd);

        if (result === 403) {
            res.status(403).json({ message: "Forbidden" });
        }
        else if (result === 404) {
            res.status(404).json({ message: "Picture is not found" });
        }
        else {
            res.status(200).json(result);
        }

    } catch (err) {
        res.status(400).send({ message: err });
    }

});


router.all("*", function (req, res) {

    res.status(404).json({ message: "Not found" });
});

module.exports = router;