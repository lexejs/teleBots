import OpenAI from "openai";
import Telegram from "node-telegram-bot-api";
import creds from "./credentials.js";
import tools from "./tools.js";

const openai = new OpenAI({
    apiKey: creds.openAIKey,
});

console.log('starting botPostman');

const bot = new Telegram(creds.postmanTelegramToken, { polling: true });

import sqlite3 from 'sqlite3';
let db = new sqlite3.Database('./postman.sqlite');
db.run('CREATE TABLE IF NOT EXISTS chat_tread(key text PRIMARY KEY, value text)');

const assistantId = creds.assistantPostmanId;


async function getTreadId(chatId) {
    try {
        return new Promise((resolve, reject) => {
            db.get(`SELECT value FROM chat_tread WHERE key = ?`, [chatId], (err, row) => {
                if (err) {
                    reject(err.message);
                }
                resolve(row ? row.value : null);
            });
        });
    }
    catch (error) {
        console.error(error);
        return null;
    }
}

async function waitForRunCompleted(threadId, runId) {
    let runStatus = null;
    do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(
            threadId,
            runId
        );
        if (runStatus.status === 'expired') {
            console.log(runStatus.status);
            return;
        }

        if (runStatus.status === 'requires_action' && runStatus.required_action.type === 'submit_tool_outputs') {
            console.log(runStatus.status);

            for (const tool_call of runStatus.required_action.submit_tool_outputs.tool_calls) {
                if (tool_call.type === 'function') {
                    if (tool_call.function.name === 'getDateTime') {
                        const obj = JSON.parse(tool_call.function.arguments);

                        console.log(obj.timezone);
                        const run = await openai.beta.threads.runs.submitToolOutputs(
                            threadId,
                            runId,
                            {
                                tool_outputs: [
                                    {
                                        tool_call_id: tool_call.id,
                                        output: new Date().toLocaleString("en-US", { timeZone: obj.timezone }),
                                    }
                                ],
                            }
                        );

                    }
                    console.log(tool_call);
                }
            }
        }
    }
    while (runStatus.status !== 'completed');
}

async function getAvailableTreadId(chatId) {
    let threadId = await getTreadId(chatId);

    if (!threadId) {
        const emptyThread = await openai.beta.threads.create();
        threadId = emptyThread.id;

        db.run(`INSERT INTO chat_tread(key, value) VALUES(?, ?)`, [chatId, threadId]);

        //console.log('Created thread for ' + msg.chat.username);
    }

    while (currentRunsForTread.indexOf(threadId) !== -1) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }


    return threadId;
}

async function askGPT(text, chatId) {
    try {
        let threadId = await getAvailableTreadId(chatId);

        currentRunsForTread.push(threadId);

        const newMessage = await openai.beta.threads.messages.create(
            threadId,
            { role: "user", content: text }
        );

        const run = await openai.beta.threads.runs.create(
            threadId,
            { assistant_id: assistantId }
        );

        await waitForRunCompleted(threadId, run.id);

        const messages = await openai.beta.threads.messages.list(
            threadId, { limit: 10, order: 'desc', before: newMessage.id }
        );

        currentRunsForTread.splice(currentRunsForTread.indexOf(threadId), 1);

        let resultString = '';
        for (const message of messages.data) {
            resultString += message.content[0].text.value + '\n';
        }

        return resultString;
    }
    catch (error) {
        console.error(error);

        if (error.status === 400 && error.message.toString().indexOf("Can't add messages to thread") !== -1) {
            //'400 Can't add messages to thread_wWXS3YmDG9ipBc2BolC3DD4T while a run run_6eARPHWFixbUf1LKGpD2Hac6 is active.'
            const tread = error.message.toString().substring(error.message.toString().indexOf("thread_"));
            const threadId = tread.substring(0, tread.indexOf(' '));
            const runStr = tread.substring(tread.indexOf("run_"));
            const runId = runStr.substring(0, runStr.indexOf(' '));

            await waitForRunCompleted(threadId, runId);

            return error.message;
        }

    }
}

let currentRunsForTread = [];

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.chat.username;
    bot.sendMessage(chatId, `Hello ${userName}!'`);
});

// regex not started with a /
bot.onText(/^[^\/]/, async (msg) => {

    const chatId = msg.chat.id;

    console.log(msg.text);

    if (creds.allowedUsers.indexOf(chatId.toString()) === -1) {
        bot.sendMessage(chatId, chatId + ' are not allowed to use this bot');
        console.log(msg.chat.username + ' are not allowed to use this bot');
        return;
    }

    bot.sendChatAction(chatId, 'typing');

    const res = await askGPT(msg.text, chatId);

    bot.sendMessage(chatId, res, { reply_to_message_id: msg.message_id });
});