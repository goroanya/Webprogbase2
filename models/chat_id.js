const ChatIDModel = require('./models').ChatID;

class ChatID {
    static async getByUsername(username) {
        return await ChatIDModel.findOne({ username });
    }

    static async update(message) {
        const chatId = await ChatIDModel.findOne({ username: message.from.username });
        if (chatId) {
            chatId.tg_id = message.from.id;
            return await chatId.save();
        }
        return await new ChatIDModel({ username: message.from.username, id: message.from.id }).save();
    }
}

module.exports = ChatID;