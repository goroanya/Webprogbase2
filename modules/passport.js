const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const BasicStrategy = require('passport-http').BasicStrategy;

// const passportJWT = require("passport-jwt");
// const JWTStrategy = passportJWT.Strategy;
// const ExtractJWT = passportJWT.ExtractJwt;

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
            const confirmPassword = req.body.confirmPassword;
            if (password !== confirmPassword) {
                done(
                    null,
                    false,
                    req.flash('signupMessage', 'Password does not match.')
                );
                return;
            }
            try {
                const addedUser = await User.insert(new User(
                    username,
                    Hash.sha512(password, process.env.SALT).passwordHash,
                    'simple',
                    req.body.fullname
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
//-------------------------------------------JWT----------------------------------------------



// passport.use(new JWTStrategy({
//     jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
//     secretOrKey: 'wi23*N1,@?"21l' },
//     async function (jwtPayload, cb) {
//         try {
//             const user = await User.getByLogin(jwtPayload.id);
//             if (!user) cb(null, false);
//             else cb(null, user);
//         } catch (err) {
//             cb(err);
//         }
//     }
// ));
