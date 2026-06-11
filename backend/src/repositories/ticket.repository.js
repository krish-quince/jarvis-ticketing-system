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

export const getTicketById = async (ticketId, companyId) => {
    const result = await pool.query(
        `
            SELECT t.*, c.category_name, p.priority_name, s.status_name 
            FROM tickets t 
            INNER JOIN ticket_categories c 
                ON c.category_id = t.category_id 
            INNER JOIN ticket_priorities p 
                ON p.priority_id = t.priority_id 
            INNER JOIN ticket_statuses s 
                ON s.status_id = t.status_id 
            WHERE t.ticket_id = $1 AND t.company_id = $2
        `, [ticketId, companyId]);



    return result.rows[0];
};

export const updateTicketStatus = async(ticketId, statusId) => {
    const result = await pool.query(
        `
            UPDATE tickets SET status_id = $1, update_timestamp = CURRENT_TIMESTAMP WHERE ticket_id = $2 RETURNING *
        `, [statusId, ticketId]
    );

    return result.rows[0];
};