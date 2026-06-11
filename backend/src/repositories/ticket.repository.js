import pool from "../config/db.js";

export const createTicket = async (ticket) => {
    const result = await pool.query(
        `
        INSERT INTO tickets
        (
            company_id,
            ticket_no,
            subject,
            description,
            category_id,
            priority_id,
            status_id,
            raised_by_user_code,
            assigned_to_user_code
        ) 
        VALUES
        (
            $1,$2,$3,$4,$5,$6,$7,$8,$9
        )
        RETURNING *
        `,
        [
            ticket.companyId,
            ticket.ticketNo,
            ticket.subject,
            ticket.description,
            ticket.category_id,
            ticket.priority_id,
            ticket.status_id,
            ticket.raisedByUserCode,
            ticket.assigned_to_user_code,
        ]
    );

    return result.rows[0];
};

export const getAllTickets = async (companyId) => {
    const result = await pool.query(`SELECT * FROM tickets WHERE company_id = $1 ORDER BY ticket_id DESC`, [companyId]);

    return result.rows;
};