const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: 'keep-the-moment',
    api_key: 826938125899335,
    api_secret: 'xJYzzi-7Lgb39GbQFEKRxzds_9o',
});

module.exports = {
    fileUpload: function (fileBuffer, callback) {
        cloudinary.v2.uploader
            .upload_stream({ resource_type: 'raw' }, function (error, result) {
                if (error) callback(error);
                else callback(null, result.url);
            })
            .end(fileBuffer);
    }
};