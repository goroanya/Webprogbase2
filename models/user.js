const models = require('./models');



class User {
    constructor(login, password, role, fullname) {
        this.login = login;
        this.password = password;
        this.fullname = fullname;
        this.role = role;
        this.createdAt = new Date();
    }

    static async getAll(page, usersPerPage) {
        return models.User.paginate({}, { page, limit: usersPerPage });
    }
    static getAllLength() {
        return models.User.countDocuments();
    }
    static insert(user) {
        return models.User(user).save();
    }
    static getByLogin(login) {
        return models.User.findOne({ login: login });
    }
    static deleteByLogin(login) {
        return models.User.findOneAndDelete({ login });
    }
    static async update(login, user) {
        let toUpdate = await this.getByLogin(login);
        if (!toUpdate) return null;

        if (user.fullname) toUpdate.fullname = user.fullname;
        if (user.role) toUpdate.role = user.role;
        if (user.bio) toUpdate.bio = user.bio;
        if (user.avaUrl) toUpdate.avaUrl = user.avaUrl;
        if (user.password) toUpdate.password = user.password;


        await toUpdate.save();
        return toUpdate;

    }

    //
    static getById(id) {
        return models.User.findById(id);
    }
    static deleteById(id) {
        return models.User.findByIdAndDelete(id);
    }
    //
    static async updateRole(login, role) {
        let user = await models.User.findOne({ login });
        user.role = role;
        await user.save();

    }

    static async addTempPhoto(auhtorId, photoId) {
        let user = await models.User.findById(auhtorId);
        user.tempPhotos.push(photoId);
        await user.save();

    }
    static async  addAlbum(auhtorId, albumId) {
        let user = await models.User.findById(auhtorId);
        user.albums.push(albumId);
        await user.save();
    }


    static async deleteTempPhoto(authorId, photoId) {
        let user = await models.User.findById(authorId);
        user.tempPhotos = user.tempPhotos.remove(photoId);
        await user.save();
    }

    static async deleteAlbum(authorId, albumId) {
        let user = await models.User.findById(authorId).populate('tempPhotos');
        user.albums = user.albums.remove(albumId);
        let photos = user.tempPhotos;
        for (let i = 0; i < photos.length; i++) {
            if (photos[i].album == albumId) {
                photos.splice(i, 1);
                i--;
            }
        }
        user.tempPhotos = photos;
        await user.save();
    }
}
module.exports = User;

Array.prototype.remove = function () {
    let what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
