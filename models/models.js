const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const ChatIDSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    tg_id: { type: Number }
});

const ChatIDModel = mongoose.model("ChatID", ChatIDSchema);

const PictureSchema = new mongoose.Schema({
    short_name: {
        type: String,
        required: true,
    },
    active: {
        type: Boolean,
    },
    time: {
        type: String,
        required: true
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

}, { timestamps: true });
PictureSchema.plugin(mongoosePaginate);

const pictureModel = mongoose.model('Picture', PictureSchema);

//

const AlbumSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
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
    coverUrl: {
        type: String,
        default: "https://increasify.com.au/wp-content/uploads/2016/08/default-image.png"
    }
}, { timestamps: true });

AlbumSchema.plugin(mongoosePaginate);

const albumModel = mongoose.model('Album', AlbumSchema);



const UserSchema = new mongoose.Schema({
    login: { type: String, required: true, unique: true },
    password: {
        type: String
    },
    googleId: {
        type: String
    },
    role: { type: String, required: true },
    fullname: { type: String },
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
    tgUsername: { type: String, unique: true }
}, { timestamps: true });
UserSchema.plugin(mongoosePaginate);

const userModel = mongoose.model('User', UserSchema);

module.exports = {
    Picture: pictureModel,
    Album: albumModel,
    User: userModel,
    ChatID: ChatIDModel
};
