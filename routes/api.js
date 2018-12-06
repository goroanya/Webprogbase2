const express = require('express');
const bodyParser = require('body-parser');
const busboyBodyParser = require('busboy-body-parser');
const passport = require('passport');

const Auth = require("../config/auth");
const Hash = require("../config/hash");
const User = require('../models/user');
const Album = require('../models/album');
const Picture = require('../models/picture');
const Pagination = require("../config/pagination");
const FormatDate = require("../config/formatDate");



require('dotenv').config();
require("../modules/passport");


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

router.get('/isunique/:login', async function (req, res) {
    try {
        const user = await User.getByLogin(req.params.login);
        if (user) res.status(200).json({ unique: false });
        else res.status(200).json({ unique: true });

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }

});
router.get("/users", authorize, Auth.checkAuthApi, async function (req, res) {
    try {
        let data = Pagination(await User.getAllLength(), parseInt(req.query.page) || 1, parseInt(req.query.offset) || 5);

        let users = await User.getAll(parseInt(req.query.page) || 1, parseInt(req.query.offset) || 3);
        data.users = users.docs;
        res.status(200).json(data);

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/users/:login", authorize, Auth.checkAuthApi, async function (req, res) {

    try {
        const user = await User.getByLogin(req.params.login);
        if (!user) res.status(404).json({ message: "User with this login is not found", login: req.params.login });
        else res.status(200).json({ user });

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }


});

router.delete("/users/:login", authorize, Auth.checkAdminApi, async function (req, res) {

    try {
        const user = await User.deleteByLogin(req.params.login);
        if (!user) res.status(404).json({ message: "User with this login is not found", login: req.params.login });
        else res.status(200).json({ user });

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }

});

router.put("/users/:login", authorize, Auth.checkAuthApi, async function (req, res) {

    if (!req.body.fullname && !req.body.role && !req.body.avaUrl && !req.body.password && !req.body.bio) {
        res.status(400).json({ message: " No one field is  specified" });
        return;
    }
    try {
        const updated = await User.update(req.params.login, {
            fullname: req.body.fullname,
            role: req.body.role,
            bio: req.body.bio,
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

router.get("/albums", authorize, Auth.checkAuthApi, async function (req, res) {

    try {

        let ownerLogin = req.query.owner;
        let user = await User.getByLogin(ownerLogin);

        let data = Pagination(await Album.getAllLength(user), parseInt(req.query.page) || 1, parseInt(req.query.offset) || 10);

        let albums = await Album.getAll(user, parseInt(req.query.page) || 1, parseInt(req.query.offset) || 10);
        data.albums = albums.docs;

        res.status(200).json(data);

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }


});


router.post("/albums", authorize, Auth.checkAuthApi, async function (req, res) {

    const name = req.body.name;
    const url = req.body.url;


    if (!name) { res.status(400).json({ message: "Field -name- is not specified" }); return; }

    const album = new Album(name, req.user, [], url);

    try {

        const newAlbum = await Album.insert(album);
        res.status(201).json(newAlbum);

    } catch (err) {
        res.status(400).json({ message: err });
    }
});

router.get("/albums/:id", authorize, Auth.checkAuthApi, async function (req, res) {

    try {

        let album = await Album.getById(req.params.id).populate("photos");

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

router.delete("/albums/:id", authorize, Auth.checkAuthApi, async function (req, res) {
    try {
        const album = await Album.getById(req.params.id);
        if (!album) res.status(404).json({ message: "Album  is not found" });
        else if (album.author != req.user.id && req.user.role !== "admin") res.status(403).json({ message: "Forbiden" });
        else {
            const deleted = await Album.delete(req.params.id);
            res.status(200).json(deleted);
        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});


router.put("/albums/:id", authorize, Auth.checkAuthApi, async function (req, res) {

    if (!req.body.name) { res.status(404).json({ message: "Field \"name\" is not specified" }); return; }
    try {
        const id = req.params.id;
        const name = req.body.name;
        const coverUrl = req.body.coverUrl;

        const album = await Album.getById(id);
        if (!album) {
            res.status(404).json({ message: `Album with this id ${id}  is not found` });
        }
        else if (album.author != req.user.id) {
            res.status(404).json({ message: "Forbidden" });
        }
        else {
            const updated = await Album.update(id, { name, coverUrl });
            res.status(200).json(updated);
        }


    } catch (err) {
        res.status(400).json({ message: err });
    }

});




//-----------------------------------------------PHOTOS-----------------------------------------------------
router.get("/photos", authorize, Auth.checkAuthApi, async function (req, res) {
    try {
        let owner = await User.getByLogin(req.query.owner);

        if (req.query.filter) {


            if (req.query.albumId) {
                let foundArray = await Picture.getAllFiltered(req.query.albumId, owner, req.query.filter, parseInt(req.query.page) || 1, parseInt(req.query.offset || 10));

                if (!foundArray.length) { res.status(404).json({ request: req.query.filter, message: `Nothing found by request : ${req.query.filter}` }); }
                else {

                    res.status(200).json({ photos: foundArray, request: req.query.filter });
                }
            }
            else {
                let foundArray = await Picture.getAllFiltered(null, owner, req.query.filter, parseInt(req.query.page) || 1, parseInt(req.query.offset || 10));

                if (!foundArray.length) { res.status(404).json({ request: req.query.filter, message: `Nothing found by request : ${req.query.filter}` }); }
                else {

                    res.status(200).json({ photos: foundArray, request: req.query.filter });
                }
            }
        }
        else {
            let photos = req.query.albumId
                ? (await Picture.getAllInAlbum(req.query.albumId, parseInt(req.query.page) || 1, parseInt(req.query.offset) || 10)).docs
                : (await Picture.getAll(owner, parseInt(req.query.page) || 1, parseInt(req.query.offset) || 10)).docs;

            res.status(200).json({ photos });
        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }

});
router.post("/photos", authorize, Auth.checkAuthApi, async function (req, res) {
    try {

        const url = req.body.url;
        const description = req.body.description;
        const short_name = req.body.name;
        const album_name = req.body.album;

        if (!short_name) { res.status(400).json({ message: `Field (name) is not specified` }); return; }
        else if (!url) { res.status(400).json({ message: `Field (url) is not specified` }); return; }

        const saved = await Picture.insert(new Picture(true, short_name, album_name, description, url, req.user, FormatDate(new Date())));


        if (saved === 403) { res.status(403).json({ message: "Forbidden" }); }
        else res.status(201).json(saved);

    } catch (err) {
        res.status(400).json({ message: err });
    }
});
router.get("/photos/:id", authorize, Auth.checkAuthApi, async function (req, res) {
    const id = req.params.id;
    try {
        const pic = await Picture.getById(id).populate("author", 'login').populate("album", "name");

        if (!pic) {
            res.status(404).json({ message: `Picture with  id ${id} is not found` });
            return;
        }
        if (pic.author.id == req.user.id || req.user.role === "admin") {

            res.status(200).json(pic);
        }
        else {

            res.status(403).json({ message: "Forbidden" });

        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });

    }
});
router.delete("/photos/:id", authorize, Auth.checkAuthApi, async function (req, res) {
    const id = req.params.id;
    try {
        const pic = await Picture.getById(id).populate('author', "login").populate("album", "name");

        if (!pic) {
            res.status(404).json({ message: `Picture with id ${id} is not found` });
            return;
        }
        if (pic.author.id == req.user.id || req.user.role === "admin") {

            const deleted = await Picture.delete(id);
            res.status(200).json(deleted);
        }


        else {
            res.status(403).json({ message: "Forbidden" });

        }
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});
router.put("/photos/:id", authorize, Auth.checkAuthApi, async function (req, res) {

    if (!req.body.name || !req.body.description) { res.status(400).send({ message: "No specified field" }); return; }

    const id = req.params.id;
    try {
        let picture = await Picture.getById(id);
        if (!picture) {
            res.status(404).json({ message: "Picture is not found" });
            return;
        }
        let toupd = { short_name: req.body.name, description: req.body.description, author: req.user };

        const result = await Picture.update(id, toupd);

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
        res.status(400).json({ message: err });
    }

});


router.all("*", function (req, res) {

    res.status(404).json({ message: "Not found" });
});

module.exports = router;