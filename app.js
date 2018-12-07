require("dotenv").config();

const Picture = require('./models/picture');
const Album = require('./models/album');
const User = require('./models/user');


const Auth = require("./config/auth");
const Cloudinary = require("./config/cloudinary");
const FormatDate = require("./config/formatDate");

const express = require('express');
const mustache = require('mustache-express');
const bodyParser = require('body-parser');
const busboyBodyParser = require('busboy-body-parser');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');

require("./modules/telegram");
require("./modules/passport");

const app = express();

app.use(express.static(path.join(__dirname, './public')));

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(flash());
app.use(bodyParser.json());
app.use(busboyBodyParser({ limit: '5mb' }));
app.use(cookieParser());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());

const viewDir = path.join(__dirname, 'views');

const usersRouter = require('./routes/users');
const albumsRouter = require('./routes/albums');
const photosRouter = require('./routes/photos');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
const developerRouter = require('./routes/developer');


app.use('/users', usersRouter);
app.use('/albums', albumsRouter);
app.use('/photos', photosRouter);
app.use('/auth', authRouter);
app.use('/developer/v1', developerRouter);
app.use('/api/v1', apiRouter);


app.engine('mst', mustache(path.join(viewDir, 'partials')));
app.set('views', viewDir);
app.set('view engine', 'mst');

const PORT = process.env.PORT || 3000;

const databaseUrl = process.env.DB_URL;

const connectOptions = { useNewUrlParser: true };
mongoose
    .connect(databaseUrl, connectOptions)
    .then(() => console.log(` database connected :${databaseUrl}`))
    .then(() =>
        app.listen(PORT, () => console.log(`Server started at port :${PORT}`))
    )
    .catch(() => console.log('ERROR: Mongo database not connected'));

//-------------------------------------------------------------------------------------------------
app.get('/', function (req, res) {
    res.render('index', {
        user: req.user,
        adminRole: req.user ? (req.user.role === 'admin' ? true : false) : false,
    });
});

app.post('/new/picture', Auth.checkAuth, function (req, res) {
    const pictureFile = req.files.pictureFile;

    const description = req.body.description;
    const short_name = req.body.short_name;
    const albumId = req.body.albumId;;


    Cloudinary.fileUpload(pictureFile.data, async (err, url) => {
        if (err) {
            req.flash("error", "Sorry.Error with uploading picture.");
            res.redirect("/error");
        } else {
            try {

                const saved = await Picture.insert(new Picture(true, short_name, albumId, description, url, req.user, FormatDate(new Date())));
                res.redirect(`/photos/${saved._id}`);

            } catch (error) {
                req.flash("error", "500 internal server error");
                res.redirect('/error');
            }
        }

    });
});
app.post('/new/album', Auth.checkAuth, async function (req, res) {

    const albumCoverFile = req.files.albumCoverFile;
    const name = req.body.name;

    try {
        if (albumCoverFile) {
            Cloudinary.fileUpload(albumCoverFile.data, async (err, url) => {
                if (err) {
                    req.flash("error", "Sorry.Error with uploading picture.");
                    res.redirect("/error");
                } else {

                    const saved = await Album.insert(new Album(name, req.user, [], url));
                    if (saved) res.redirect(`/albums/${saved._id}`);
                    else res.redirect('/error?message=500+Internal+server+error');
                }
            });
        }
        else {

            const saved = await Album.insert(new Album(name, req.user, [], null));
            if (saved) res.redirect(`/albums/${saved._id}`);
            else res.redirect('/error?message=500+Internal+server+error');

        }
    } catch (error) {
        req.flash("error", "500 internal server error");
        res.redirect('/error');
    }
});

app.post('/update/albums/:id', Auth.checkAuth, async function (req, res) {
    const albumCoverFile = req.files.albumCoverFile;
    const id = req.params.id;
    const name = req.body.name;
    try {
        if (albumCoverFile) {

            Cloudinary.fileUpload(albumCoverFile.data, async (err, url) => {
                if (err) {
                    req.flash("error", "Sorry.Error with uploading picture.");
                    res.redirect("/error");

                } else {
                    const updated = await Album.update(id, { name, coverUrl: url });
                    if (updated) res.redirect(`/albums/${updated._id}`);
                    else res.redirect('/error?message=500+Internal+server+error');
                }

            });
        }
        else {
            const updated = await Album.update(id, { name, coverUrl: null });
            if (updated) res.redirect(`/albums/${updated._id}`);
            else res.redirect('/error?message=500+Internal+server+error');
        }
    } catch (error) {
        req.flash("error", "500 internal server error");
        res.redirect('/error');
    }
});
app.post('/update/users/:login', Auth.checkAuth, async function (req, res) {
    const avaFile = req.files.avaUrlFile;

    if (req.params.login != req.user.login) {
        req.flash("error", "403 Forbidden");
        res.redirect('/error');
        return;
    }
    try {
        if (avaFile) {
            Cloudinary.fileUpload(avaFile.data, async (err, url) => {
                if (err) {
                    req.flash("error", "Sorry.Error with uploading picture.");
                    res.redirect("/error");

                } else {
                    const updated = await User.update(req.params.login, {
                        fullname: req.body.fullname,
                        bio: req.body.userBio,
                        avaUrl: url,
                    });
                    if (updated) res.redirect('/users/' + updated.login);
                    else res.redirect('/error?message=500+Internal+server+error');
                }

            });
        } else {

            const updated = await User.update(req.params.login, {
                fullname: req.body.fullname,
                bio: req.body.userBio,
                tgUsername: req.body.tgUsername
            });
            if (updated) res.redirect('/users/' + updated.login);
            else res.redirect('/error?message=500+Internal+server+error');

        }
    } catch (error) {
        req.flash("error", "500 internal server error");
        res.redirect('/error');
    }

});

app.get('/error', function (req, res) {

    let message = req.query.message;
    if (req.query.message && message.includes('+')) {
        message = message.replace(/+/g, " ");
    }


    res.render('index', {
        message: message || req.flash("error"),
        user: req.user,
        adminRole: req.user ? (req.user.role === 'admin' ? true : false) : false,
    });
});

app.get('/about', function (req, res) {
    res.render('about', {
        user: req.user,
        adminRole: req.user ? (req.user.role === 'admin' ? true : false) : false,
    });
});

app.all('/*', function (req, res) {
    res.status(404).render('index', {
        message: "404\nNOT FOUND",
        user: req.user,
        adminRole: req.user ? (req.user.role === 'admin' ? true : false) : false,
    });

});





