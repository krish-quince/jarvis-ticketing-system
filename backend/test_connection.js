import pool from './src/config/db.js';

async function main() {
  try {
    const res = await pool.query('SELECT COUNT(*) FROM users');
    console.log('Postgres connection successful. Total users in DB:', res.rows[0].count);
    
    const users = await pool.query('SELECT user_code, email FROM users');
    console.log('Seeded/Registered Users in DB:', users.rows);
  } catch (e) {
    console.error('Postgres connection failed:', e.message);
  } finally {
    await pool.end();
  }
}

main();
