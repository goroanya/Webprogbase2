module.exports = {
    checkAuth: function (req, res, next) {
        if (!req.user) return res.sendStatus(401);
        next();
    },

    checkAdmin: function (req, res, next) {
        if (!req.user) res.sendStatus(401);
        else if (req.user.role !== 'admin')
            res.sendStatus(403);
        else next();
    },
    checkAuthAPI: function (req, res, next) {
        if (!req.user) res.status(401).json({ message: "Not authorized" });
        next();
    },

    checkAdminAPI: function (req, res, next) {
        if (!req.user) res.status(401).json({ message: "Not authorized" });
        else if (req.user.role !== 'admin')
            res.status(400).json({ message: "Forbidden" });
        else next();
    }
};