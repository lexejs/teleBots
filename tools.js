import OpenAI from "openai";
import Telegram from "node-telegram-bot-api";
import config from "./credentials.js";

import sqlite3 from 'sqlite3';
let db = new sqlite3.Database('./ubersetzen.sqlite');

const openai = new OpenAI({
    apiKey: config.openAIKey,
});
const assistantId = config.ubersetzenAssistId;

db.run('CREATE TABLE IF NOT EXISTS chat_tread(key text PRIMARY KEY, value text)');

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
        return error;
    }
}

async function listMessages(threadId) {
    const messages = await openai.beta.threads.messages.list(
        threadId, { limit: 10 }
    );

    let resultString = '';
    for (const message of messages.data) {
        resultString += message.content[0].text.value + '\n';
        console.log(message);
    }

    return resultString;
}

async function main() {
    console.log('start');
    let list = await listMessages('thread_YTCqDuK6klqhzM6hl4XKzito');
    console.log(list);
}
main();
