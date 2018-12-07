const models = require("./models");
const User = require("./user");

class Album {
    constructor(name, author, photos, coverUrl) {
        if (name) this.name = name;
        this.author = author.id;
        this.photos = photos;
        if (coverUrl) this.coverUrl = coverUrl;
    }

    static async insert(album) {
        const savedAlbum = await models.Album(album).save();
        await User.addAlbum(album.author, savedAlbum.id);
        return savedAlbum;
    }

    static getAll(user, page, albumPerPage) {
        return models.Album.paginate({ "author": user.id }, { page, limit: albumPerPage , sort: { createdAt: -1 } });
    }
    static getAllLength(user) {
        return models.Album.countDocuments({ "author": user.id });
    }

    static getById(id) {
        return models.Album.findById(id);
    }

    static async update(id, toUpd) {

        let album = await models.Album.findById(id);
        if (toUpd.name != null) album.name = toUpd.name;
        if (toUpd.coverUrl != null) album.coverUrl = toUpd.coverUrl;
        await album.save();
        return album;

    }

    static async delete(id) {

        const album = await models.Album.findByIdAndRemove(id);
        await User.deleteAlbum(album.author, album.id);
        await models.Picture.deleteMany({ album: album.id });
        return album;
    }


    static async addPhoto(albumId, photoId) {
        let album = await models.Album.findById(albumId);
        album.photos.push(photoId);
        await album.save();

    }


    static async deletePhoto(albumId, picId) {
        let album = await models.Album.findById(albumId);
        album.photos = album.photos.remove(picId);
        await album.save();

    }
}

Array.prototype.remove = function () {
    let what,
        a = arguments,
        L = a.length,
        ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
module.exports = Album;
