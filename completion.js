var creds = require("./credentials.js");

const Telegram = require("node-telegram-bot-api");
const bot = new Telegram(creds.tele4Token, { polling: true });

var OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: creds.openAIKey,
});

const states = [];

log("starting bot");

function getSystemPrompt(msg) {
    if (states[msg.chat.id] == "ubersetzen") {
        return creds.ubersetzenPrompt;
    }
    if (states[msg.chat.id] == "TranslatekPL") {
        return creds.TranslatekPLPrompt;
    }
    return creds.defaultCompletionPrompt;
}
function checkAuthorized(msg) {
    if (creds.allowedUsers.indexOf(msg.chat.id.toString()) == -1) {
        bot.sendMessage(msg.chat.id, "unauthorized", {
            reply_to_message_id: msg.message_id,
        });
        return false;
    }
    return true;
}

bot.onText(/\/start/, (msg) => {
    states[msg.chat.id] = "start";
    bot.sendMessage(msg.chat.id, `Assistant activated!`);
    log(msg.chat.id, "started " + msg.chat.username, states[msg.chat.id]);
});

bot.onText(/\/ubersetzen/, (msg) => {
    states[msg.chat.id] = "ubersetzen";
    bot.sendMessage(msg.chat.id, `Translator activated!'`);
    log(msg.chat.id, "started " + msg.chat.username, states[msg.chat.id]);
});

bot.onText(/\/translatek/, (msg) => {
    states[msg.chat.id] = "TranslatekPL";
    bot.sendMessage(msg.chat.id, `TranslatekPL włączony!'`);
    log(msg.chat.id, "started " + msg.chat.username, states[msg.chat.id]);
});



bot.onText(/\/image/, (msg) => {
    if (!checkAuthorized(msg)) return;

    bot.sendChatAction(msg.chat.id, "typing");

    getImage(msg.text).then((res) => {
        bot.sendMessage(msg.chat.id, JSON.stringify(res, null, 2), {
            reply_to_message_id: msg.message_id,
        });
    });
});

// regex not started with a slash
bot.onText(/^[^\/]/, async (msg) => {
    if (!checkAuthorized(msg)) return;

    bot.sendChatAction(msg.chat.id, "typing");

    const systemPrompt = getSystemPrompt(msg);

    await streamCompletion(msg.text, systemPrompt, msg);
});

async function streamCompletion(text, systemPrompt, msg) {
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text },
            ],
            model: "gpt-4-1106-preview",
            stream: true,
        });

        let responseId = "";
        let result = "";
        let sentResult = 0;

        for await (const chunk of completion) {
            const delta = (chunk.choices[0].delta.content ?? "").toString();
            result += delta;
            // log("DELTA: " + delta);

            if ((!delta
                || result.length < sentResult + 20
                || (delta.indexOf(' ') < 0) && (delta.indexOf('.') < 0))
                && !chunk.choices[0].finish_reason)
                continue;
            // log(" SENT: " + sentResult + " LENGTH: " + result.length + "RESULT: " + result);

            if (responseId == "") {
                try {
                    const respMsg = await bot.sendMessage(msg.chat.id, result, {
                        reply_to_message_id: msg.message_id,
                    });
                    responseId = respMsg.message_id;
                    sentResult = result.length;
                }
                catch (error) {
                    await logError(error.message);
                }


            } else {
                try {
                    await bot.editMessageText(result, {
                        chat_id: msg.chat.id,
                        message_id: responseId,
                    });
                    sentResult = result.length;
                }
                catch (error) {
                    await logError(error.message);
                }

            }

            // if (chunk.choices[0].finish_reason == "stop") {
            //     break;
            // }

        }

    } catch (error) {

        await logError(error.message);

        await bot.sendMessage(msg.chat.id, error.message, {
            reply_to_message_id: msg.message_id,
        });

    }
}

async function getCompletion(text, systemPrompt) {
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text },
            ],
            model: "gpt-4-1106-preview",
        });
        const res = completion.choices[0].message.content;
        return res;
    } catch (error) {
        await logError(error);
        return error;
    }
}

async function getImage(text) {
    if (text == "" || text == undefined || text == "/image") {
        return "provide description";
    }
    try {
        const image = await openai.images.generate({
            model: "dall-e-3",
            prompt: text,
        });

        return image.data;
    }
    catch (error) {
        await logError(error);
        return error;
    }
}

function log(msg) {
    console.log(new Date().toUTCString(), msg);
}
async function logError(msg) {
    console.error(new Date().toUTCString(), msg);
    if (msg.indexOf("429 Too Many Requests") > -1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}