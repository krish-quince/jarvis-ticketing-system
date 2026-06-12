import pool from "../config/db.js";

export const createComment = async (ticketId, userCode, commentText) => {
    const result = await pool.query(
        `
            INSERT INTO ticket_comments(ticket_id, commented_by_user_code, comment_text)
            VALUES($1,$2,$3) RETURNING *
        `, [ticketId, userCode, commentText]
    );

    return result.rows[0];
};

export const getCommentsByTicketId = async(ticketId, companyId) => {
    const result = await pool.query(
        `
            SELECT tc.*
            FROM ticket_comments tc
            INNER JOIN tickets t
                ON t.ticket_id = tc.ticket_id
            WHERE tc.ticket_id = $1 AND t.company_id = $2
            ORDER BY tc.created_at ASC
        `, [ticketId, companyId]
    );

    return result.rows;
};

export const getTicketById = async(ticketId, companyId) => {
    const result = await pool.query(
        `
            SELECT ticket_id FROM tickets WHERE ticket_id = $1 AND company_id = $2
        `, [ticketId, companyId]
    );

    return result.rows[0];
};
