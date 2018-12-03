module.exports = {
    checkAuth: function (req, res, next) {
        if (!req.user) res.status(401).json({ message: "Not authorized" });
        next();
    },

    checkAdmin: function (req, res, next) {
        if (!req.user) res.status(401).json({ message: "Not authorized" });
        else if (req.user.role !== 'admin')
            res.status(400).json({ message: "Forbidden" });
        else next();
    }
};