import pool from "./src/config/db.js";;

try {
    const result = await pool.query("SELECT NOW()");
    console.log(result.rows[0]);
} catch(error) {
    console.error(error);
}

process.exit();