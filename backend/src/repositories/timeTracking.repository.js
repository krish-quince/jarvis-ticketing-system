import pool from "../config/db.js";

/**
 * Create a new time tracking entry when a user opens a ticket.
 */
export const createEntry = async (ticketId, userCode, statusName) => {
    const result = await pool.query(
        `INSERT INTO ticket_time_entries (ticket_id, user_code, status_name, started_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING entry_id, ticket_id, user_code, status_name, time_spent_seconds, started_at`,
        [ticketId, userCode, statusName]
    );
    return result.rows[0];
};

/**
 * Close (stop) a time tracking entry.
 */
export const closeEntry = async (entryId, timeSpentSeconds) => {
    const result = await pool.query(
        `UPDATE ticket_time_entries
         SET ended_at = NOW(),
             time_spent_seconds = $2
         WHERE entry_id = $1
         RETURNING *`,
        [entryId, timeSpentSeconds]
    );
    return result.rows[0];
};

/**
 * Get all time entries for a ticket, joined with user info.
 */
export const getEntriesByTicket = async (ticketId) => {
    const result = await pool.query(
        `SELECT 
            te.entry_id,
            te.ticket_id,
            te.user_code,
            te.status_name,
            te.time_spent_seconds,
            te.started_at,
            te.ended_at,
            te.created_at,
            u.email,
            u.first_name,
            u.last_name
         FROM ticket_time_entries te
         LEFT JOIN users u ON u.user_code = te.user_code
         WHERE te.ticket_id = $1
         ORDER BY te.started_at DESC`,
        [ticketId]
    );
    return result.rows;
};

/**
 * Get total time spent on a ticket (sum of all entries in seconds).
 */
export const getTotalTimeByTicket = async (ticketId) => {
    const result = await pool.query(
        `SELECT COALESCE(SUM(time_spent_seconds), 0) AS total_seconds
         FROM ticket_time_entries
         WHERE ticket_id = $1`,
        [ticketId]
    );
    return Number(result.rows[0].total_seconds);
};
