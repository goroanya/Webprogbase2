const passport = require('passport');

const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;


const User = require('../models/user');
const Hash = require("../config/hash");

require('dotenv').config();

//------------------------------------------LOCAL----------------------
passport.use(
    'local-login',
    new LocalStrategy(
        {
            passReqToCallback: true, // allows us to pass back the entire request to the callback
        },
        async function (req, username, password, done) {
            try {
                const user = await User.getByLogin(username);
                return user
                    ? Hash.sha512(password, process.env.SALT).passwordHash === user.password
                        ? done(null, user)
                        : done(
                            null,
                            false,
                            req.flash('loginMessage', 'Oops! Wrong password.')
                        )
                    : done(null, false, req.flash('loginMessage', 'No user found.'));
            }
            catch (error) {
                done(error);
            }
        }
    )
);

passport.use(
    'local-signup',
    new LocalStrategy(
        {
            passReqToCallback: true, // allows us to pass back the entire request to the callback
        },
        async function (req, username, password, done) {
            try {
                const addedUser = await User.insert(new User(
                    username,
                    Hash.sha512(password, process.env.SALT).passwordHash,
                    'simple',
                ));

                if (addedUser) done(null, addedUser);
                else done('Unexpected error');
            } catch (err) {
                done(
                    null,
                    false,
                    req.flash('signupMessage', 'That login is already taken.')
                );
            }
        }
    )
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    try {
        const user = await User.getById(id);
        if (!user) done('No user');
        else done(null, user);

    } catch (err) {
        done(err);
    }
});

//-------------------------------------------BASIC--------------------------------------
passport.use("basic", new BasicStrategy(
    async function (username, password, done) {

        try {
            const user = await User.getByLogin(username);
            if (!user) { return done(null, false); }
            if (Hash.sha512(password, process.env.SALT).passwordHash !== user.password) {
                return done(null, false);
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));
//-------------------------------------------GOOGLE OATH2----------------------------------------------


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.URL_CALLBACK
},
    async function (accessToken, refreshToken, profile, cb) {
        try {
            let user = await User.findOrCreate({
                googleId: profile.id,

                login: profile.emails[0].value.substring(0, profile.emails[0].value.lastIndexOf("@")),

                avaUrl: profile.photos[0].value,

                fullname: profile.displayName,
                role: "simple"
            });
            return cb(null, user);
        } catch (err) {
            return cb(err);
        }
    }
));
