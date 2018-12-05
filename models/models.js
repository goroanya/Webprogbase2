const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const mongoosePaginate = require('mongoose-paginate');
 

const PictureSchema = new mongoose.Schema({
    short_name: {
        type: String,
        required: true,
        unique: true,
    },
    active: {
        type: Boolean,
    },
    createdAt: {
        type: Date
    },
    album: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
        required: false,
    },
    description: {
        type: String,
    },
    url: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true

    }
    
    // viewers: [
    //     {
    //
    //             type: mongoose.Schema.Types.ObjectId,
    //             ref: "User"
    //
    //     }. 
    // ],
});
PictureSchema.plugin(uniqueValidator);
PictureSchema.plugin(mongoosePaginate);

const pictureModel = mongoose.model('Picture', PictureSchema);

//

const AlbumSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    photos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Picture',
        },
    ],
    coverUrl : {
        type: String,
        default: "https://increasify.com.au/wp-content/uploads/2016/08/default-image.png"
    }
});

AlbumSchema.plugin(uniqueValidator);
AlbumSchema.plugin(mongoosePaginate);

const albumModel = mongoose.model('Album', AlbumSchema);



const UserSchema = new mongoose.Schema({
    login: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: true,
    },
    role: { type: String, required: true },
    fullname: { type: String },
    registeredAt: { type: Date },
    avaUrl: {
        type: String,
        default: 'https://ictv.ua/wp-content/plugins/all-in-one-seo-pack/images/default-user-image.png',
    },
    bio: {
        type: String,
    },
    tempPhotos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Picture',
        },
    ],
    albums: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Album',
        },
    ],
});
UserSchema.plugin(uniqueValidator);
UserSchema.plugin(mongoosePaginate);

const userModel = mongoose.model('User', UserSchema);

module.exports = {
    Picture: pictureModel,
    Album: albumModel,
    User: userModel,
};
