import { config } from "dotenv";
import { createPool } from "mariadb";

import { Bot, Keyboard } from "grammy";
import { conversations, create, createConversation } from "@grammyjs/conversations";

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


// HELP FUNCTIONS
function makeUserList(users) {
    let result = "";

    for (let i in users) {
        result += `${Number(i) + 1}. ${users[i]["name"]}\n`;
    }

    return result;
}


// KEYBOARDS

const keyboard = new Keyboard()
    .text("Show Users").row()
    .text("Add User").row()
    .text("Delete User").resized();

const usersListTypeKeyboard = new Keyboard()
    .text("Logistians").row()
    .text("Drivers").row()
    .text("All employees").resized();

// CONVERSATIONS

async function addUser(conversation, ctx) { 
    await ctx.reply("Enter a user name");
    const { message } = await conversation.waitFor("message:text");

    await db.addUser(message.text);
    await ctx.reply("The user was successfully added!");
}
bot.use(createConversation(addUser));

async function deleteUser(conversation, ctx) {
    const users = await db.getUsers();
    const buttonRows = users.map((user) => [Keyboard.text(user["name"])]);
    const usersKeyboard = Keyboard.from(buttonRows).resized();

    await ctx.reply("Choose the user to be deleted", {
        reply_markup: usersKeyboard
    });

    const { message } = await conversation.waitFor("message:text");
    try {
        db.deletUser(message.text);
        await ctx.reply(`The user ${message.text} was successfully deleted!`, {
            reply_markup: keyboard
        });
    } catch (e) {
        console.log(e);
        await ctx.reply("Something went wrong. Try again later.", {
            reply_markup: keyboard
        });
    }
}
bot.use(createConversation(deleteUser));

async function showUsers(conversation, ctx) {
    await ctx.reply("Employees list:\n1. Logistins list\n2. Drivers list\n3. All employees", {
        reply_markup: usersListTypeKeyboard,
    });

    const { message } = await conversation.waitFor("message:text");
    switch (message.text) {
        case "Logistians":
            try {
                const users = await db.getUsers("logistian");
                let result = makeUserList(users);

                await ctx.reply(result, {
                    reply_markup: keyboard,
                });
            } catch (e) {
                console.log(e);
                await ctx.reply("Something went wrong. Try again later", {
                    reply_markup: keyboard,
                });
            }
            break;
        case "Drivers":
            try {
                const users = await db.getUsers("driver");
                let result = makeUserList(users);

                await ctx.reply(result, {
                    reply_markup: keyboard,
                });
            } catch (e) {
                await ctx.reply("Something went wrong. Try again later", {
                    reply_markup: keyboard,
                });
            }
            break;
        case "All employees":
            try {
                const users = await db.getUsers();
                let result = makeUserList(users);

                await ctx.reply(result, {
                    reply_markup: keyboard,
                });
            } catch (e) {
                await ctx.reply("Something went wrong. Try again later", {
                    reply_markup: keyboard,
                });
            }
            break;
        default:
            await ctx.reply("Incorrect value!", {
                reply_markup: keyboard,
            });
            break;
    }
}
bot.use(createConversation(showUsers));


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

// bot.hears("Show Users", async (ctx) => {
//     const users = await db.getUsers();
//     let text = "";
// 
//     for (let i in users) {
//         text += `${Number(i) + 1}. ${users[i]["name"]}\n`;
//     }
// 
//     await ctx.reply(text);
// });

bot.hears("Show Users", async (ctx) => {
    await ctx.conversation.enter("showUsers");
});

bot.hears("Add User", async (ctx) => {
    await ctx.conversation.enter("addUser");
});

bot.hears("Delete User", async (ctx) => {
    await ctx.conversation.enter("deleteUser");
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