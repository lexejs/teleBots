var creds = require("./credentials.js");
const Telegram = require('node-telegram-bot-api');

var OpenAI = require("openai");

console.log('starting bot');

const bot = new Telegram(creds.telegramToken, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.chat.username;
    bot.sendMessage(chatId, `Hello ${userName}!'`);
    bot.sendMessage(-1001928644986, JSON.stringify(msg, null, 2));

    console.log(chatId, 'started ' + userName);
});

bot.on('message', (msg) => {
    bot.sendMessage(msg.chat.id, JSON.stringify(msg, null, 2));
});

//bot.onText(/^[^\/]/, (msg) => {
//  bot.sendMessage(msg.chat.id, JSON.stringify(msg, null, 2));
//  console.log(msg.chat.id, ' sent ' + msg.text);
//});

bot.onText(/\/image/, (msg) => {
    if (msg.chat.id != '307947060') {
        bot.sendMessage(msg.chat.id, 'unauthorized', { reply_to_message_id: msg.message_id });
        return;
    }

    bot.sendChatAction(msg.chat.id, 'typing');

    getImage(msg.text).then((res) => {
        bot.sendMessage(msg.chat.id, JSON.stringify(res, null, 2), { reply_to_message_id: msg.message_id });
    });
});


const openai = new OpenAI({
    apiKey: creds.openAIKey,
});

async function getImage(text) {
    const image = await openai.images.generate({ model: "dall-e-3", prompt: text });

    return image.data;
}

const http = require('node:http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World\n');
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});