const Picture = require('./models/picture');
const Album = require('./models/album');

const Auth = require("./config/auth");
const Cloudinary = require("./config/cloudinary");


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
        secret: 'SEGReT$25_',
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

// database
// const databaseUrl =
//     'mongodb://goroanya:goroanya99@ds145093.mlab.com:45093/keep-the-moment';
const databaseUrl = 'mongodb://localhost:27017/lab7';

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





app.post('/new/album', Auth.checkAuth, function (req, res) {
    const album_name = req.body.album_name;
    const album = new Album(album_name, req.user, []);

    try {

        Album.insert(album);
        res.redirect('/albums?page=1');

    } catch (err) {
        res.redirect("/error");
        req.flash("error", "500\n Internal Server Error");
    }

});

app.post('/new/picture', Auth.checkAuth, function (req, res) {
    const pictureFile = req.files.pictureFile;

    const description = req.body.description;
    const short_name = req.body.short_name;
    const album_name = req.body.album_name;;

    //remember datetime before saving picture to cloudinary (if internet is lost)
    const dateTime = Date.now();

    Cloudinary.fileUpload(pictureFile.data, async (err, url) => {
        if (err) {
            req.flash("error", "Sorry.Error with uploading picture.");
            res.redirect("/error");
        } else {
            try {

                const saved = await Picture.insert(new Picture(true, short_name, album_name, description, url, req.user, dateTime));
                res.redirect('/photos/page/' + saved.short_name);

            } catch (error) {
                req.flash("addPicError", `This short name (${short_name}) is already taken.`);
                if (album_name) res.redirect(`/albums/${album_name}/new`);
                else { }// ! TODО перенаправити на обнобник, що додає ТІЛЬКИ  тимчаосву фотографію
            }
            //res.redirect("/error");
        }

    });


});

app.post('/update/picture', Auth.checkAuth, async function (req, res) {
    const description = req.body.description;
    const short_name = req.body.short_name;
    const oldShort_name = req.body.old_short_name;
    const id = req.body.id;

    let pic = { short_name, description, author: req.user };

    try {
        const result = await Picture.update(id, pic);

        if (result === 403) {
            req.flash("error", "403\n Forbidden");
            res.redirect("/error");
        }
        else if (result === 404) {
            req.flash("error", "404\n Picture is Not Found");
            res.redirect("/error");
        }
        else {
            res.redirect(`/photos/page/${result.short_name}`);
        }

    } catch (err) {

        req.flash("updatePicError", "This short name is already taken.");
        res.redirect(`/photos/${oldShort_name}/update`);


    }

});
app.post('/update/album', Auth.checkAuth, async function (req, res) {
    const oldName = req.body.oldName;
    const newName = req.body.name;
    try {
        const album = await Album.getByName(oldName);
        if (!album) {
            req.flash("error", "404\n Album  is Not Found");
            res.redirect("/error");
        }
        else if (album.author != req.user.id) {
            req.flash("error", "403\n Forbidden");
            res.redirect("/error");
        }
        else {
            await Album.update(oldName, newName);
            res.redirect('/albums?page=1');
        }
    }
    catch (err) {

        req.flash("updateAlbumError", "This name is already taken.");
        res.redirect(`/albums/${oldName}/update`);


    }
});

app.get('/error', function (req, res) {
    res.render('index', {
        message:  req.query.message || req.flash("error"),
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





