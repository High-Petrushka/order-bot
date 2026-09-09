import { config } from "dotenv";
import { createPool } from "mariadb";

import { Bot, Keyboard } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";

import DB from "./bot_modules/database.js"

config();


// DATABASE SETTINGS

const db = new DB(
    process.env.DB_HOST,
    process.env.DB_USER,
    process.env.DB_PWD,
    process.env.DB_NAME,
    5
);


// BOT SETTINGS

const bot = new Bot(process.env.TOKEN);
bot.use(conversations());

bot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "get_users", description: "Show list of users" },
]);


// KEYBOARDS

const keyboard = new Keyboard().text("Show Users").row().text("Add User").resized();


// CONVERSATIONS

async function addUser(conversation, ctx) { 
    await ctx.reply("Enter a user name");
    const { message } = await conversation.waitFor("message:text")

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`INSERT INTO users(name) VALUES ('${message.text}')`);
        await ctx.reply("The user was successfully added!");
    } catch (e) {
        console.log(e);
    } finally {
        if (conn) conn.release();
    }
}
bot.use(createConversation(addUser));


// COMMANDS

bot.command("start", async (ctx) => {
    await ctx.reply("Welcome! Up and runnig!", {
        reply_markup: keyboard,
    });
});

bot.command("get_users", async (ctx) => {
    let conn;
    try {
        let result = "";
        let count = 1;
        conn = await pool.getConnection();
        const users = await conn.query("SELECT name FROM users");
        for (user of users) {
            result += `${count}. ${user["name"]}\n`;
            count++;
        }
        ctx.reply(result);
    } catch (err) {
        console.log(err);
    } finally {
        if (conn) conn.release();
    }
});


// LISTENERS

bot.hears("Show Users", async (ctx) => {
    const users = await db.getUsers();
    let text = "";

    for (let i in users) {
        text += `${Number(i) + 1}. ${users[i]["name"]}\n`;
    }

    await ctx.reply(text);
});

bot.hears("Add User", async (ctx) => {
    await ctx.conversation.enter("addUser");
});

bot.hears(/fuck/, async (ctx) => {
    await ctx.reply("Don't even give it a try >:{");
});


// FILTERS

bot.on("message", async (ctx) => {
    await ctx.reply("Got another message");
});

bot.on("edit:text", async (ctx) => {
    await ctx.reply("The message was edited!", {
        reply_parameters: { message_id: ctx.msgId },
    });
});

bot.start();