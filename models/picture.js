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
    constructor(active, short_name, albumId, description, url, author, time) {
        this.active = active;
        this.short_name = short_name;
        this.album = albumId;
        this.description = description;
        this.url = url;
        this.author = author.id;
        this.time= time;
    }


    static getById(id){
        return models.Picture.findById(id);
    }


    static async getAllFiltered(albumId, owner, filter, page, picturesPerPage) {

        
        let foundArray = albumId
            ? await models.Picture.find({ "short_name": { $regex: new RegExp(filter), $options: 'i' }, "album": albumId, author: owner.id }).sort({ createdAt: -1 })
            : await models.Picture.find({ "short_name": { $regex: new RegExp(filter), $options: 'i' }, "active": true, author: owner.id }).sort({ createdAt: -1 });

        
        foundArray = paginate(foundArray, page, picturesPerPage);

        return foundArray;

    }
    static getAll(owner, page, picturesPerPage) {
        return models.Picture.paginate({ "author": owner.id, 'active': true }, { page, limit: picturesPerPage, sort: { 'createdAt': -1 } });
    }

    static async getAllInAlbum(albumId, page, picturesPerPage) {
        return models.Picture.paginate({ "album": albumId }, { page, limit: picturesPerPage, sort: { 'createdAt': -1 } });
    }

    static getAllLength(user) {
        return models.Picture.countDocuments({ "author": user.id });
    }


    static async delete(id) {
        const pic = await models.Picture.findByIdAndRemove(id).populate("album", "name").populate('author','login');

        if (pic.active && pic.album) {

            await Album.deletePhoto(pic.album.id, id);
            await User.deleteTempPhoto(pic.author, id);

        } else if (!pic.active && pic.album) {

            await Album.deletePhoto(pic.album.id, id);
        }
        else if (pic.active && !pic.album) {

            await User.deleteTempPhoto(pic.author, id);
        }
        return pic;
    }

    static async  insert(pic) {
        let savedPic;
        if (pic.albumId) {
            
            // якщо нам передали id альбому, то картинка вже НЕ ТІЛЬКИ ТИМЧАСОВА і буде зберігатись в альбомі
            let album = await Album.getById(pic.albumId);

            //якщо адмін хоче додати фото не в свій альбом
            if (album && album.author != pic.author) return 403;

            pic.album = album._id;
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
                if (!copy.album) await models.Picture.findByIdAndDelete(copy.id);
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
