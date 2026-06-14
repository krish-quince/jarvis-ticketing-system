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
            assigned_to_user_code,
            department
        ) 
        VALUES
        (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
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
            ticket.department || 'General',
        ]
    );

    return result.rows[0];
};

export const getAllTickets = async (companyId, user) => {
    let query = `
         SELECT t.*, s.status_name, s.status_color, c.category_name, p.priority_name, p.priority_color
         FROM tickets t
         LEFT JOIN ticket_statuses s ON s.status_id = t.status_id
         LEFT JOIN ticket_categories c ON c.category_id = t.category_id
         LEFT JOIN ticket_priorities p ON p.priority_id = t.priority_id
         WHERE t.company_id = $1
    `;
    const params = [companyId];

    if (user && Number(user.roleId) !== 1) {
        query += ` AND (t.assigned_to_user_code = $2 OR t.raised_by_user_code = $3 OR t.department = $4)`;
        params.push(user.userCode, user.userCode, user.department || 'General');
    }

    query += ` ORDER BY t.ticket_id DESC`;

    const result = await pool.query(query, params);
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

export const updateTicketStatus = async(ticketId, statusId, companyId) => {
    const result = await pool.query(
        `
            UPDATE tickets
            SET status_id = $1, update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $2 AND company_id = $3
            RETURNING *
        `, [statusId, ticketId, companyId]
    );

    return result.rows[0];
};

export const updateTicketAssignee = async(ticketId, assignedToUserCode, companyId) => {
    const result = await pool.query(
        `
            UPDATE tickets
            SET assigned_to_user_code = $1, update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $2 AND company_id = $3
            RETURNING *
        `, [assignedToUserCode, ticketId, companyId]
    );

    return result.rows[0];
};

export const updateTicketPriority = async(ticketId, priorityId, companyId) => {
    const result = await pool.query(
        `
            UPDATE tickets
            SET priority_id = $1, update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $2 AND company_id = $3
            RETURNING *
        `, [priorityId, ticketId, companyId]
    );

    return result.rows[0];
};

export const updateTicketCategory = async(ticketId, categoryId, companyId) => {
    const result = await pool.query(
        `
            UPDATE tickets
            SET category_id = $1, update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $2 AND company_id = $3
            RETURNING *
        `, [categoryId, ticketId, companyId]
    );

    return result.rows[0];
};

export const resolveTicket = async(ticketId, resolvedByUserCode, statusId, companyId) => {
    const result = await pool.query(
        `
            UPDATE tickets
            SET
                status_id = $1,
                resolved_by_user_code = $2,
                resolution_date = CURRENT_TIMESTAMP,
                update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $3 AND company_id = $4
            RETURNING *
        `, [statusId, resolvedByUserCode, ticketId, companyId]
    );

    return result.rows[0];
};

export const getUserByCodeAndCompany = async(userCode, companyId) => {
    const result = await pool.query(
        `
            SELECT user_code
            FROM users
            WHERE user_code = $1 AND company_id = $2
        `, [userCode, companyId]
    );

    return result.rows[0];
};

export const getStatusByIdAndCompany = async(statusId, companyId) => {
    const result = await pool.query(
        `
            SELECT status_id
            FROM ticket_statuses
            WHERE status_id = $1 AND company_id = $2 AND is_active = true
        `, [statusId, companyId]
    );

    return result.rows[0];
};

export const getResolvedStatusByCompany = async(companyId) => {
    const result = await pool.query(
        `
            SELECT status_id
            FROM ticket_statuses
            WHERE company_id = $1 AND LOWER(status_name) = LOWER($2) AND is_active = true
            ORDER BY display_order ASC
            LIMIT 1
        `, [companyId, "Resolved"]
    );

    return result.rows[0];
};

export const getPriorityByIdAndCompany = async(priorityId, companyId) => {
    const result = await pool.query(
        `
            SELECT priority_id
            FROM ticket_priorities
            WHERE priority_id = $1 AND company_id = $2
        `, [priorityId, companyId]
    );

    return result.rows[0];
};

export const getCategoryByIdAndCompany = async(categoryId, companyId) => {
    const result = await pool.query(
        `
            SELECT category_id
            FROM ticket_categories
            WHERE category_id = $1 AND company_id = $2
        `, [categoryId, companyId]
    );

    return result.rows[0];
};

export const deleteTicket = async (ticketId, companyId) => {
    const result = await pool.query(
        `DELETE FROM tickets WHERE ticket_id = $1 AND company_id = $2 RETURNING *`,
        [ticketId, companyId]
    );
    return result.rows[0];
};

export const updateTicketDetails = async (ticketId, subject, description, companyId) => {
    const result = await pool.query(
        `UPDATE tickets SET subject = $1, description = $2, update_timestamp = CURRENT_TIMESTAMP WHERE ticket_id = $3 AND company_id = $4 RETURNING *`,
        [subject, description, ticketId, companyId]
    );
    return result.rows[0];
};
