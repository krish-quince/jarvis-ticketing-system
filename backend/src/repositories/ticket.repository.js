import pool from "../config/db.js";

export const createTicket = async (ticket, client = null) => {
  const db = client || pool;

  const result = await db.query(
    `
        INSERT INTO tickets
(
    company_code,
    subject,
    description,

    category_id,
    subcategory_id,

    priority_id,
    status_id,

    raised_by_user_code,
    assigned_to_user_code,
    allocated_to_user_code,

    due_date,

    department_id
)
        VALUES
(
    $1,$2,$3,
    $4,$5,
    $6,$7,
    $8,$9,$10,
    $11,
    $12
)
        RETURNING *
        `,
    [
      ticket.companyCode,
      ticket.subject,
      ticket.description,

      ticket.category_id,
      ticket.subcategory_id,

      ticket.priority_id,
      ticket.status_id,

      ticket.raisedByUserCode,
      ticket.assigned_to_user_code,
      ticket.allocated_to_user_code,

      ticket.due_date,

      ticket.department_id,
    ],
  );

  return result.rows[0];
};

export const createTicketAttachments = async (
  ticketId,
  uploadedByUserCode,
  files,
  client = null,
) => {
  const db = client || pool;
  const attachments = [];

  for (const file of files) {
    const result = await db.query(
      `
      INSERT INTO ticket_attachments
        (ticket_id, file_name, file_path, uploaded_by_user_code)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        ticketId,
        file.originalname,
        `/uploads/tickets/${file.filename}`,
        uploadedByUserCode,
      ],
    );
    attachments.push({ ...result.rows[0], mime_type: file.mimetype });
  }

  return attachments;
};

export const getAllTickets = async (
  companyCode,
  user,
  search = "",
  page = 1,
  limit = 25,
  sortBy = "Updated",
  sortOrder = "desc",
) => {
  const offset = (page - 1) * limit;

  const allowedSortFields = {
    "Ticket number": "CAST(substring(t.ticket_no FROM '\\d+') AS INTEGER)",
    "Subject": "LOWER(t.subject)",
    "From": "LOWER(t.raised_by_user_code)",
    "Company": "LOWER(t.company_code)",
    "Priority": "p.priority_value",
    "Status": "LOWER(s.status_name)",
    "Date": "t.created_at",
    "Due": "t.due_date",
    "Tech": "LOWER(COALESCE((SELECT string_agg(u.first_name || ' ' || u.last_name, ', ') FROM ReturnTable(t.assigned_to_user_code, '|') rt JOIN users u ON u.user_code = rt.Value), ''))",
    "Updated": "t.update_timestamp"
  };

  const orderField = allowedSortFields[sortBy] || "t.update_timestamp";
  const orderDirection = sortOrder?.toLowerCase() === "asc" ? "ASC" : "DESC";

  let query = `
    SELECT
      t.*,
      (
        SELECT string_agg(u.first_name || ' ' || u.last_name, ', ')
        FROM ReturnTable(t.assigned_to_user_code, '|') rt
        JOIN users u ON u.user_code = rt.Value
      ) AS assigned_to_name,
      (
        SELECT string_agg(u.first_name || ' ' || u.last_name, ', ')
        FROM ReturnTable(t.allocated_to_user_code, '|') rt
        JOIN users u ON u.user_code = rt.Value
      ) AS allocated_to_name,
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
    WHERE 1=1
  `;

  const params = [];
  if (companyCode) {
    query += ` AND t.company_code = $1`;
    params.push(companyCode);
  }

  const isAdminOrSuperAdmin = user && (Number(user.roleId) === 1 || Number(user.roleId) === 4);

  if (!isAdminOrSuperAdmin) {
    query += `
      AND (
        $${params.length + 1} IN (SELECT Value FROM ReturnTable(t.assigned_to_user_code, '|'))
        OR $${params.length + 1} IN (SELECT Value FROM ReturnTable(t.allocated_to_user_code, '|'))
        OR t.raised_by_user_code = $${params.length + 1}
      )
    `;
    params.push(user.userCode);
  }

  if (search) {
    query += `
      AND (
        t.ticket_no ILIKE $${params.length + 1}
        OR t.subject ILIKE $${params.length + 1}
        OR t.description ILIKE $${params.length + 1}
        OR c.category_name ILIKE $${params.length + 1}
        OR sc.subcategory_name ILIKE $${params.length + 1}
        OR s.status_name ILIKE $${params.length + 1}
        OR p.priority_name ILIKE $${params.length + 1}
        OR t.raised_by_user_code ILIKE $${params.length + 1}
        OR COALESCE(t.assigned_to_user_code, '') ILIKE $${params.length + 1}
      )
    `;
    params.push(`%${search}%`);
  }

  query += `
    ORDER BY ${orderField} ${orderDirection}, t.ticket_id DESC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;
  params.push(Number(limit), Number(offset));

  const result = await pool.query(query, params);
  return result.rows;
};

export const getTicketById = async (ticketId, companyCode) => {
  let query = `
    SELECT
        t.*,
        c.category_name,
        sc.subcategory_name,
        p.priority_name,
        p.priority_color,
        s.status_name,
        s.status_color,
        (
          SELECT string_agg(u.first_name || ' ' || u.last_name, ', ')
          FROM ReturnTable(t.assigned_to_user_code, '|') rt
          JOIN users u ON u.user_code = rt.Value
        ) AS assigned_to_name,
        (
          SELECT string_agg(u.first_name || ' ' || u.last_name, ', ')
          FROM ReturnTable(t.allocated_to_user_code, '|') rt
          JOIN users u ON u.user_code = rt.Value
        ) AS allocated_to_name,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'user_code', u.user_code,
                'name', u.first_name || ' ' || u.last_name
              )
            )
            FROM ReturnTable(t.assigned_to_user_code, '|') rt
            JOIN users u ON u.user_code = rt.Value
          ),
          '[]'::json
        ) AS assigned_users,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'user_code', u.user_code,
                'name', u.first_name || ' ' || u.last_name
              )
            )
            FROM ReturnTable(t.allocated_to_user_code, '|') rt
            JOIN users u ON u.user_code = rt.Value
          ),
          '[]'::json
        ) AS allocated_users,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'attachment_id', ta.attachment_id,
                'file_name', ta.file_name,
                'url', ta.file_path,
                'uploaded_at', ta.uploaded_at
              )
              ORDER BY ta.attachment_id
            )
            FROM ticket_attachments ta
            WHERE ta.ticket_id = t.ticket_id
          ),
          '[]'::json
        ) AS attachments

        FROM tickets t

        LEFT JOIN ticket_categories c
            ON c.category_id = t.category_id

        LEFT JOIN ticket_subcategories sc
            ON sc.subcategory_id = t.subcategory_id

        LEFT JOIN ticket_priorities p
            ON p.priority_id = t.priority_id

        LEFT JOIN ticket_statuses s
            ON s.status_id = t.status_id

        WHERE
            t.ticket_id = $1
  `;
  const params = [ticketId];
  if (companyCode) {
    query += ` AND t.company_code = $2`;
    params.push(companyCode);
  }

  const result = await pool.query(query, params);
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

export const updateTicketAllocated = async (
  ticketId,
  allocatedToUserCode,
  companyCode,
  client = null,
) => {
  const db = client || pool;
  const result = await db.query(
    `
            UPDATE tickets
            SET allocated_to_user_code = $1, update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $2 AND company_code = $3
            RETURNING *
        `,
    [allocatedToUserCode, ticketId, companyCode],
  );

  return result.rows[0];
};

export const updateTicketAssignAndAllocate = async (
  ticketId,
  assignedToUserCode,
  allocatedToUserCode,
  companyCode,
  client = null,
) => {
  const db = client || pool;
  const result = await db.query(
    `
            UPDATE tickets
            SET assigned_to_user_code = $1, allocated_to_user_code = $2, update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $3 AND company_code = $4
            RETURNING *
        `,
    [assignedToUserCode, allocatedToUserCode, ticketId, companyCode],
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
  subCategoryId,
  companyCode,
  client = null,
) => {
  const db = client || pool;
  const result = await db.query(
    `
            UPDATE tickets
            SET category_id = $1, subcategory_id = $2, update_timestamp = CURRENT_TIMESTAMP
            WHERE ticket_id = $3 AND company_code = $4
            RETURNING *
        `,
    [categoryId, subCategoryId, ticketId, companyCode],
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

export const getStatusByIdAndCompany = async (statusId, companyCode) => {
  const result = await pool.query(
    `
            SELECT status_id
            FROM ticket_statuses
            WHERE status_id = $1 AND company_code = $2 AND is_active = true
        `,
    [statusId, companyCode],
  );

  return result.rows[0];
};

export const getResolvedStatusByCompany = async (companyCode) => {
  const result = await pool.query(
    `
            SELECT status_id
            FROM ticket_statuses
            WHERE LOWER(status_name) = LOWER('Resolved') AND company_code = $1 AND is_active = true
            LIMIT 1
        `,
    [companyCode],
  );

  return result.rows[0];
};

export const getPriorityByIdAndCompany = async (priorityId, companyCode) => {
  const result = await pool.query(
    `
            SELECT priority_id
            FROM ticket_priorities
            WHERE priority_id = $1 AND company_code = $2
        `,
    [priorityId, companyCode],
  );

  return result.rows[0];
};

export const getCategoryByIdAndCompany = async (categoryId, companyCode) => {
  const result = await pool.query(
    `
            SELECT category_id
            FROM ticket_categories
            WHERE category_id = $1 AND company_code = $2
        `,
    [categoryId, companyCode],
  );

  return result.rows[0];
};

export const getSubCategoryById = async (subCategoryId, companyCode) => {
  const result = await pool.query(
    `
      SELECT
        subcategory_id,
        category_id
      FROM ticket_subcategories
      WHERE subcategory_id = $1 AND company_code = $2
    `,
    [subCategoryId, companyCode],
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

export const updateTicketDueDate = async (
  ticketId,
  dueDate,
  companyCode,
  client = null,
) => {
  const db = client || pool;

  const result = await db.query(
    `
      UPDATE tickets
      SET
        due_date = $1,
        update_timestamp = CURRENT_TIMESTAMP
      WHERE
        ticket_id = $2
      AND
        company_code = $3
      RETURNING *
    `,
    [dueDate, ticketId, companyCode],
  );

  return result.rows[0];
};
