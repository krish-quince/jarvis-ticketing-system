import pool from "../config/db.js";

export const createHistory = async(ticketId, fieldName, oldValue, newValue, userCode) => {
    const result = await pool.query(
        `
            INSERT INTO ticket_history
            (
                ticket_id, 
                field_name, 
                old_value, 
                new_value, 
                changed_by_user_code
            )
            VALUES($1,$2,$3,$4,$5)
            RETURNING *
        `, [ticketId, fieldName, oldValue, newValue, userCode]
    );

    return result.rows[0];
};

export const getTicketHistory = async (ticketId) => {
    const result = await pool.query(
        `
            SELECT * FROM ticket_history WHERE ticket_id = $1 ORDER BY changed_at DESC  
        `, [ticketId]
    );

    return result.rows;
};