import pool from "../config/db.js";

export const createHistory = async(ticketId, fieldName, oldValue, newValue, userCode, client = null) => {
    const db = client || pool;
    
    const result = await db.query(
        `
            INSERT INTO ticket_history
            (
                ticket_id, 
                field_changed, 
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

export const getTicketHistory = async (ticketId, companyCode) => {
    const result = await pool.query(
        `
            SELECT th.*
            FROM ticket_history th
            INNER JOIN tickets t
                ON t.ticket_id = th.ticket_id
            WHERE th.ticket_id = $1 AND t.company_code = $2
            ORDER BY th.changed_at DESC  
        `, [ticketId, companyCode]
    );

    return result.rows;
};
