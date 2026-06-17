import pool from "../config/db.js";

export const createTicket = async (ticket, client = null) => {
  const db = client || pool;

  const result = await db.query(
    `
        INSERT INTO tickets
(
    company_code,
    ticket_no,
    subject,
    description,

    category_id,
    subcategory_id,

    priority_id,
    status_id,

    raised_by_user_code,
    assigned_to_user_code,

    due_date,

    department_id
)
        VALUES
(
    $1,$2,$3,$4,
    $5,$6,
    $7,$8,
    $9,$10,
    $11,
    $12
)
        RETURNING *
        `,
    [
  ticket.companyCode,
  ticket.ticketNo,
  ticket.subject,
  ticket.description,

  ticket.category_id,
  ticket.subcategory_id,

  ticket.priority_id,
  ticket.status_id,

  ticket.raisedByUserCode,
  ticket.assigned_to_user_code,

  ticket.due_date,

  ticket.department_id,
],
  );

  return result.rows[0];
};

export const getAllTickets = async (
  companyCode,
  user,
  search = "",
  page = 1,
  limit = 25,
) => {
  const offset = (page - 1) * limit;

  let query = `
         SELECT
            t.*,
            s.status_name,
            s.status_color,
            c.category_name,
            sc.subcategory_name,
            p.priority_name,
            p.priority_color
         FROM tickets t
         LEFT JOIN ticket_statuses s
            ON s.status_id = t.status_id
         LEFT JOIN ticket_categories c
            ON c.category_id = t.category_id
         LEFT JOIN ticket_subcategories sc
            ON sc.subcategory_id = t.subcategory_id
         LEFT JOIN ticket_priorities p
            ON p.priority_id = t.priority_id
         WHERE t.company_code = $1
    `;

  const params = [companyCode];

  if (user && Number(user.roleId) !== 1) {
    query += `
            AND (
                t.assigned_to_user_code = $2
                OR
                t.raised_by_user_code = $3
                OR
                t.department_id = $4
            )
        `;

    params.push(user.userCode, user.userCode, user.departmentId);
  }

  if (search) {
    query += `
            AND (
                t.ticket_no ILIKE $${params.length + 1}
                OR
                t.subject ILIKE $${params.length + 1}
                OR
                t.description ILIKE $${params.length + 1}
            )
        `;

    params.push(`%${search}%`);
  }

  query += `
        ORDER BY t.ticket_id DESC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
    `;

  params.push(Number(limit), Number(offset));

  const result = await pool.query(query, params);

  return result.rows;
};

export const getTicketById = async (ticketId, companyCode) => {
  const result = await pool.query(
    `
    SELECT
        t.*,
        c.category_name,
        sc.subcategory_name,
        p.priority_name,
        p.priority_color,
        s.status_name,
        s.status_color

        FROM tickets t

        INNER JOIN ticket_categories c
            ON c.category_id = t.category_id

        LEFT JOIN ticket_subcategories sc
            ON sc.subcategory_id = t.subcategory_id

        INNER JOIN ticket_priorities p
            ON p.priority_id = t.priority_id

        INNER JOIN ticket_statuses s
            ON s.status_id = t.status_id

        WHERE
            t.ticket_id = $1
        AND 
        t.company_code = $2
    `,
    [ticketId, companyCode],
  );

  return result.rows[0];
};

export const updateTicketStatus = async (
  ticketId,
  statusId,
  companyCode,
  client = null,
) => {
  const db = client || pool;
  const result = await db.query(
    `
            UPDATE tickets
            SET status_id = $1, update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $2 AND company_code = $3
            RETURNING *
        `,
    [statusId, ticketId, companyCode],
  );

  return result.rows[0];
};

export const updateTicketAssignee = async (
  ticketId,
  assignedToUserCode,
  companyCode,
  client = null,
) => {
  const db = client || pool;
  const result = await db.query(
    `
            UPDATE tickets
            SET assigned_to_user_code = $1, update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $2 AND company_code = $3
            RETURNING *
        `,
    [assignedToUserCode, ticketId, companyCode],
  );

  return result.rows[0];
};

export const updateTicketPriority = async (
  ticketId,
  priorityId,
  companyCode,
  client = null,
) => {
  const db = client || pool;
  const result = await db.query(
    `
            UPDATE tickets
            SET priority_id = $1, update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $2 AND company_code = $3
            RETURNING *
        `,
    [priorityId, ticketId, companyCode],
  );

  return result.rows[0];
};

export const updateTicketCategory = async (
  ticketId,
  categoryId,
  companyCode,
  client = null,
) => {
  const db = client || pool;
  const result = await db.query(
    `
            UPDATE tickets
            SET category_id = $1, update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $2 AND company_code = $3
            RETURNING *
        `,
    [categoryId, ticketId, companyCode],
  );

  return result.rows[0];
};

export const resolveTicket = async (
  ticketId,
  resolvedByUserCode,
  statusId,
  companyCode,
  client = null,
) => {
  const db = client || pool;
  const result = await db.query(
    `
            UPDATE tickets
            SET
                status_id = $1,
                resolved_by_user_code = $2,
                resolution_date = CURRENT_TIMESTAMP,
                update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $3 AND company_code = $4
            RETURNING *
        `,
    [statusId, resolvedByUserCode, ticketId, companyCode],
  );

  return result.rows[0];
};

export const getUserByCodeAndCompany = async (userCode, companyCode) => {
  const result = await pool.query(
    `
            SELECT user_code
            FROM users
            WHERE user_code = $1 AND company_code = $2
        `,
    [userCode, companyCode],
  );

  return result.rows[0];
};

export const getStatusByIdAndCompany = async (statusId) => {
  const result = await pool.query(
    `
            SELECT status_id
            FROM ticket_statuses
            WHERE status_id = $1 AND is_active = true
        `,
    [statusId],
  );

  return result.rows[0];
};

export const getResolvedStatusByCompany = async () => {
  const result = await pool.query(
    `
            SELECT status_id
            FROM ticket_statuses
            WHERE LOWER(status_name) = LOWER('Resolved') AND is_active = true
            LIMIT 1
        `,
    ["Resolved"],
  );

  return result.rows[0];
};

export const getPriorityByIdAndCompany = async (priorityId) => {
  const result = await pool.query(
    `
            SELECT priority_id
            FROM ticket_priorities
            WHERE priority_id = $1
        `,
    [priorityId],
  );

  return result.rows[0];
};

export const getCategoryByIdAndCompany = async (categoryId) => {
  const result = await pool.query(
    `
            SELECT category_id
            FROM ticket_categories
            WHERE category_id = $1
        `,
    [categoryId],
  );

  return result.rows[0];
};

export const deleteTicket = async (ticketId, companyCode, client = null) => {
  const db = client || pool;
  const result = await db.query(
    `DELETE FROM tickets WHERE ticket_id = $1 AND company_code = $2 RETURNING *`,
    [ticketId, companyCode],
  );
  return result.rows[0];
};

export const updateTicketDetails = async (
  ticketId,
  subject,
  description,
  companyCode,
  client = null,
) => {
  const db = client || pool;
  const result = await db.query(
    `UPDATE tickets SET subject = $1, description = $2, update_timestamp = CURRENT_TIMESTAMP WHERE ticket_id = $3 AND company_code = $4 RETURNING *`,
    [subject, description, ticketId, companyCode],
  );
  return result.rows[0];
};
