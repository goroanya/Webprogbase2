module.exports = {
    checkAuth: function (req, res, next) {
        if (!req.user) {
            res.redirect('/error?message=Not+authorized');
        }
        else next();
    },
    checkAuthApi: function (req, res, next) {
        if (!req.user) res.status(401).json({ message: "Not authorized" });
        next();
    },
    checkAdminApi: function (req, res, next) {
        if (!req.user) res.status(401).json({ message: "Not authorized" });
        else if (req.user.role !== 'admin')
            res.status(400).json({ message: "Forbidden" });
        else next();
    }
};