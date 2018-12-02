
const crypto = require('crypto');

module.exports = {
    sha512: function (password, salt) {
            const hash = crypto.createHmac('sha512', salt);
            hash.update(password);
            const value = hash.digest('hex');
            return {
                salt: salt,
                passwordHash: value,
            };
        }
}