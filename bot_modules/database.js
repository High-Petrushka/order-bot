
async function getUsers(pool) { 
    let conn;
    try {
        conn = await pool.getConnection();
        const users = await conn.query("SELECT name FROM users");
        return users;
    } catch (e) {
        console.log(e);
        return null;
    } finally {
        if (conn) conn.release();
    }
}

const database = { "getUsers": getUsers }

export default database;