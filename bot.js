require("dotenv").config();

const grammy = require("grammy");
const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

const bot = new grammy.Bot(process.env.TOKEN);

bot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "get_users", description: "Show list of users" },
]);

bot.command("start", async (ctx) => {
    await ctx.reply("Welcome! Up and runnig!");
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

bot.on("message", async (ctx) => {
    await ctx.reply("Got another message");
});

bot.start();