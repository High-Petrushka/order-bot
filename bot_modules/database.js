import { createPool } from "mariadb";

class DB {
    constructor (host, user, password, database, connectionLimit) {
        this.pool = createPool({
            host: host,
            user: user,
            password: password,
            database: database,
            connectionLimit: connectionLimit
        });
    }

    async getUsers() {
        let conn;
        try {
            conn = await this.pool.getConnection();
            return await conn.query("SELECT name FROM users");
        } catch (e) {
            console.log(e);
        } finally {
            if (conn) conn.release();
        }
    }

    async addUser(userName) {
        let conn;
        try {
            conn = await this.pool.getConnection();
            await conn.query("INSERT INTO users(name) VALUES (?)", [userName]);
        } catch (e) {
            throw e;
        } finally {
            if (conn) conn.release();
        }
    }

    async deletUser(userName) {
        let conn;
        try {
            conn = await this.pool.getConnection();
            await conn.query("DELETE FROM users WHERE name = ?", [userName]);
        } catch (e) {
            throw e;
        } finally {
            if (conn) conn.release();
        }
    }
}

export default DB;
