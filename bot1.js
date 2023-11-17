import OpenAI from "openai";
import Telegram from "node-telegram-bot-api";
import creds from "./credentials.js";

const openai = new OpenAI({
    apiKey: creds.openAIKey,
});
let dictionary = {
    "firstKey": "firstValue"
};

const bot = new Telegram(creds.telegramToken, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.chat.username;
    bot.sendMessage(chatId, `Hello ${userName}!'`);
});

bot.onText(/.*/, async (msg) => {
    const assistantId = creds.ubersetzenAssistId;
    const chatId = msg.chat.id;
    const text = msg.text;

    if (creds.allowedUsers.indexOf(chatId.toString()) === -1) {
        bot.sendMessage(chatId, chatId + ' are not allowed to use this bot');
        return;
    }

    let threadId = dictionary[chatId];

    if (!threadId) {
        const emptyThread = await openai.beta.threads.create();
        dictionary[chatId] = emptyThread.id;
        threadId = emptyThread.id;
    }

    const threadMessages = await openai.beta.threads.messages.create(
        threadId,
        { role: "user", content: text }
    );

    let run = await openai.beta.threads.runs.create(
        threadId,
        { assistant_id: assistantId }
    );

    let run2 = await openai.beta.threads.runs.retrieve(
        threadId,
        run.id
    );

    var dotsMessage = await bot.sendMessage(chatId, '...');
    bot.sendChatAction(chatId, 'typing');

    while (run2.status !== 'completed') {
        run2 = await openai.beta.threads.runs.retrieve(
            threadId,
            run.id
        );
    }
    const messages = await openai.beta.threads.messages.list(
        threadId, { limit: 1, order: 'desc' }
    );

    const res = messages.data[0].content[0].text.value;

    bot.deleteMessage(chatId, dotsMessage.message_id);

    bot.sendMessage(chatId, res);
});