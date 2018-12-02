const models = require("./models");
const Album = require("./album");
const User = require("./user");

function paginate(entities, page, entitiesPerPage) {
    const firstEntityIndex = (page - 1) * entitiesPerPage;
    const lastEntityIndex = firstEntityIndex + entitiesPerPage - 1;

    entities = entities.slice(firstEntityIndex, lastEntityIndex + 1);
    return entities;
}

class Picture {
    constructor(active, short_name, album_name, description, url, author, createdAt) {
        this.active = active;
        this.short_name = short_name;
        this.album_name = album_name;
        this.description = description;
        this.url = url;
        this.author = author.id;
        this.createdAt = createdAt;
    }


    static getByShortName(short_name) {
        return models.Picture.findOne({ short_name: short_name });
    }

    static async getAllFiltered(albumName, filter, page, picturesPerPage) {

        let album = await Album.getByName(albumName);
        let photos = await models.Picture.find({ "album": album.id });
        let foundArray = [];
        for (let photo of photos) {
            if (photo.short_name.toLowerCase().indexOf(filter.toLowerCase()) !== -1) foundArray.push(photo);
        }

        foundArray = paginate(foundArray, page, picturesPerPage);

        return foundArray;

    }
    static getAll(user, page, picturesPerPage) {
        if (user.role === "admin") return models.Picture.paginate({}, { page, limit: picturesPerPage });
        else return models.Picture.paginate({ "author": user.id }, { page, limit: picturesPerPage });
    }

    static async getAllInAlbum(albumName, page, picturesPerPage) {
        let album = await Album.getByName(albumName);
        return models.Picture.paginate({ "album": album.id }, { page, limit: picturesPerPage });
    }

    static getAllLength(user) {
        if (user.role === "admin") return models.Picture.countDocuments();
        else return models.Picture.countDocuments({ "author": user.id });
    }


    static async delete(short_name) {
        const pic = await models.Picture.findOneAndRemove({ short_name: short_name }).populate("album", "name");

        if (pic.active && pic.album) {

            await Album.deletePhoto(pic.album, pic.id);
            await User.deleteTempPhoto(pic.author, pic.id);

        } else if (!pic.active && pic.album) {

            await Album.deletePhoto(pic.album, pic.id);
        }
        else if (pic.active && !pic.album) {

            await User.deleteTempPhoto(pic.author, pic.id);
        }
        return pic;




    }

    static async  insert(pic) {
        if (pic.album_name) {
            // якщо нам передали ім"я альбому, то картинка вже НЕ ТІЛЬКИ ТИМЧАСОВА і буде зберігатись в альбомі

            let album = await Album.getByName(pic.album_name);
            //якщо адмін хоче додати фото не в свій альбом
            if (album && album.author != pic.author) return 403;

            //створюємо новий альбом
            if (!album) {
                album = await Album.insert({ name: pic.album_name, author: pic.author, photos: [] });
            }
            pic.album = album.id;
            const savedPic = await models.Picture(pic).save();
            await User.addTempPhoto(pic.author, savedPic.id);
            await Album.addPhoto(pic.album, savedPic.id);

            return savedPic;

        }
        else {
            // якщо картинка тільки тимчасова, ми  не додаємо  її в альбом, але додаємо до тимчасових картинкох користувача

            const savedPic = await models.Picture(pic).save();
            await User.addTempPhoto(pic.author, savedPic.id);
            return savedPic;

        }

    }

    static async update(id, pic) {
        let pictureToUpdate = await models.Picture.findById(id);

        if (!pictureToUpdate) return 404;
        else if (pictureToUpdate.author != pic.author.id) return 403;
        else {
            if (pic.short_name) pictureToUpdate.short_name = pic.short_name;
            if (pic.description) pictureToUpdate.description = pic.description;
            return models.Picture.findByIdAndUpdate(id, pictureToUpdate, { new: true });
        }
    }
}

module.exports = Picture;
