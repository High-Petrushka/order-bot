require("dotenv").config();
require("grammy").Keyboard;

const grammy = require("grammy");
const { conversations, createConversation } = require(
    "@grammyjs/conversations",
);


// DATABASE SETTINGS

const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});


// BOT SETTINGS

const bot = new grammy.Bot(process.env.TOKEN);
bot.use(conversations());

bot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "get_users", description: "Show list of users" },
]);


// KEYBOARDS

const keyboard = new grammy.Keyboard().text("Show Users").row().text("Add User").resized();


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
    let conn;
    try {
        conn = await pool.getConnection();

        let text = "";

        const users = await conn.query("SELECT name FROM users");

        for (i in users) {
            text += `${Number(i) + 1}. ${users[i]["name"]}\n`;
        }

        await ctx.reply(text);
    } catch (e) {
        console.log(e);
    } finally {
        if (conn) conn.release();
    }
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