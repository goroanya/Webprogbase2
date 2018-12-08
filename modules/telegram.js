const botApi = require("telegram-bot-api");
const ChatID = require('../models/chat_id');

const bot = new botApi({
    token: process.env.BOT_TOKEN,
    updates: { enabled: true }
});

bot.on("message", async message => {
    await ChatID.update(message);
});

module.exports = {
    sendMessage: async (text, username) => {
        const chatId = await ChatID.getByUsername(username);
        if (!chatId) return null;
        else {
            await bot.sendMessage({
                text,
                chat_id: chatId.tg_id,
                parse_mode: "markdown"
            });
            return chatId;
        }
    }
};