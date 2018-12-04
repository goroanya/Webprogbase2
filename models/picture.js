const models = require("./models");
const Album = require("./album");
const User = require("./user");
let pretty = require('pretty-date-js');

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

    static async getAllFiltered(albumName, owner, filter, page, picturesPerPage) {

        let album = await Album.getByName(albumName);
        let photos = albumName
            ? await models.Picture.find({ "album": album.id, author: owner.id }).sort({ 'createdAt': -1 })
            : await models.Picture.find({ 'active': true, author: owner.id }).sort({ 'createdAt': -1 });

        let foundArray = [];
        for (let photo of photos) {
            if (photo.short_name.toLowerCase().indexOf(filter.toLowerCase()) !== -1) {
                photo.createdAt = pretty(photo.createdAt, {});
                foundArray.push(photo);
            }
        }
        foundArray = paginate(foundArray, page, picturesPerPage);

        return foundArray;

    }
    static getAll(owner, page, picturesPerPage) {
        return models.Picture.paginate({ "author": owner.id, 'active': true }, { page, limit: picturesPerPage, sort: { 'createdAt': -1 } });
    }

    static async getAllInAlbum(albumName, page, picturesPerPage) {
        let album = await Album.getByName(albumName);
        return models.Picture.paginate({ "album": album.id }, { page, limit: picturesPerPage, sort: { 'createdAt': -1 } });
    }

    static getAllLength(user) {
        return models.Picture.countDocuments({ "author": user.id });
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
        let savedPic;
        if (pic.album_name) {
            // якщо нам передали ім"я альбому, то картинка вже НЕ ТІЛЬКИ ТИМЧАСОВА і буде зберігатись в альбомі

            let album = await Album.getByName(pic.album_name);
            //якщо адмін хоче додати фото не в свій альбом
            if (album && album.author != pic.author) return 403;

            //створюємо новий альбом
            if (!album) {
                album = await Album.insert({ name: pic.album_name, author: pic.author, photos: [] });
            }
            Album.setCover(album.id, pic.url);

            pic.album = album.id;
            savedPic = await models.Picture(pic).save();
            await User.addTempPhoto(pic.author, savedPic.id);
            await Album.addPhoto(pic.album, savedPic.id);
        }
        else {
            // якщо картинка тільки тимчасова, ми  не додаємо  її в альбом, але додаємо до тимчасових картинок користувача

            savedPic = await models.Picture(pic).save();
            await User.addTempPhoto(pic.author, savedPic.id);
        }
        let time = 86400000;// 24 hours 
        setTimeout(async () => {
            try {

                // змінюємо статус картинки active = false
                let copy = savedPic;
                copy.active = false;
                await this.update(savedPic.id, copy);

                //видаляємо картинку з тимчасових картинок користувача
                await User.deleteTempPhoto(copy.author, copy.id);

                //якщо картинку не зберегли в альбом-видаляємо її з бази даних
                if(!copy.album) await models.Picture.findOneAndRemove({ short_name: copy.short_name });
            } catch (err) {
                console.log(err);
            }
        }, time);


        return savedPic;
    }

    static async update(id, pic) {
        let pictureToUpdate = await models.Picture.findById(id);

        if (!pictureToUpdate) return 404;
        else if (pictureToUpdate.author != pic.author.id) return 403;
        else {
            if (pic.short_name) pictureToUpdate.short_name = pic.short_name;
            if (pic.description) pictureToUpdate.description = pic.description;
            if (pic.active) pictureToUpdate.active = pic.active;
            return models.Picture.findByIdAndUpdate(id, pictureToUpdate, { new: true });
        }
    }
}

module.exports = Picture;
