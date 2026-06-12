const pool = require("../config/db");
const {
  isTicketAdmin,
  requireCurrentUser,
  requireTicketAdmin,
} = require("../utils/accessControl");

const ticketSelect = `
  SELECT
    t.*,
    c.category_name,
    p.priority_name,
    p.priority_color,
    s.status_name,
    s.status_color,
    s.is_closed_status,
    raised.first_name AS raised_by_first_name,
    raised.last_name AS raised_by_last_name,
    assigned.first_name AS assigned_to_first_name,
    assigned.last_name AS assigned_to_last_name,
    resolved.first_name AS resolved_by_first_name,
    resolved.last_name AS resolved_by_last_name
  FROM tickets t
  JOIN ticket_categories c ON t.category_id = c.category_id
  JOIN ticket_priorities p ON t.priority_id = p.priority_id
  JOIN ticket_statuses s ON t.status_id = s.status_id
  JOIN users raised ON t.raised_by_user_code = raised.user_code
  LEFT JOIN users assigned ON t.assigned_to_user_code = assigned.user_code
  LEFT JOIN users resolved ON t.resolved_by_user_code = resolved.user_code
`;

const getDefaultStatusId = async (client, companyId) => {
  const result = await client.query(
    `
    SELECT status_id
    FROM ticket_statuses
    WHERE company_id = $1
      AND is_active = true
      AND is_default = true
    ORDER BY display_order, status_id
    LIMIT 1
    `,
    [companyId]
  );

  return result.rows[0]?.status_id;
};

const getClosedStatusId = async (client, companyId) => {
  const result = await client.query(
    `
    SELECT status_id
    FROM ticket_statuses
    WHERE company_id = $1
      AND is_active = true
      AND is_closed_status = true
    ORDER BY display_order, status_id
    LIMIT 1
    `,
    [companyId]
  );

  return result.rows[0]?.status_id;
};

const getCompanyCode = async (client, companyId) => {
  const result = await client.query(
    `
    SELECT company_code
    FROM companies
    WHERE company_id = $1
    `,
    [companyId]
  );

  return result.rows[0]?.company_code || "TKT";
};

const writeHistory = async (
  client,
  ticketId,
  fieldChanged,
  oldValue,
  newValue,
  changedBy
) => {
  if (String(oldValue || "") === String(newValue || "")) {
    return;
  }

  await client.query(
    `
    INSERT INTO ticket_history
      (ticket_id, field_changed, old_value, new_value, changed_by_user_code)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [ticketId, fieldChanged, oldValue, newValue, changedBy]
  );
};

const getTicketForUser = async (ticketId, currentUser) => {
  const params = [ticketId, currentUser.company_id];
  let accessSql = "";

  if (!isTicketAdmin(currentUser)) {
    params.push(currentUser.user_code);
    accessSql = `
      AND (
        t.raised_by_user_code = $3
        OR t.assigned_to_user_code = $3
      )
    `;
  }

  const result = await pool.query(
    `
    ${ticketSelect}
    WHERE t.ticket_id = $1
      AND t.company_id = $2
      ${accessSql}
    `,
    params
  );

  return result.rows[0] || null;
};

exports.createTicket = async (req, res) => {
  const client = await pool.connect();

  try {
    const currentUser = await requireCurrentUser(req, res);

    if (!currentUser) {
      return;
    }

    const {
      subject,
      description,
      category_id,
      priority_id,
      assigned_to_user_code,
      due_date,
      is_recurring,
    } = req.body;

    if (!subject || !category_id || !priority_id) {
      return res.status(400).json({
        message: "Subject, category and priority are required",
      });
    }

    if (assigned_to_user_code && !isTicketAdmin(currentUser)) {
      return res.status(403).json({
        message: "Only admins can assign tickets",
      });
    }

    await client.query("BEGIN");

    const defaultStatusId = await getDefaultStatusId(
      client,
      currentUser.company_id
    );

    if (!defaultStatusId) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "No default ticket status is configured for this company",
      });
    }

    if (assigned_to_user_code) {
      const assignedUser = await client.query(
        `
        SELECT user_code
        FROM users
        WHERE user_code = $1
          AND company_id = $2
          AND is_active = true
        `,
        [assigned_to_user_code, currentUser.company_id]
      );

      if (assignedUser.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Assigned user is not active in this company",
        });
      }
    }

    const companyCode = await getCompanyCode(
      client,
      currentUser.company_id
    );
    const ticketNo = `${companyCode}-${Date.now()}`;

    const result = await client.query(
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
        due_date,
        is_recurring,
        user_code
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
      `,
      [
        currentUser.company_id,
        ticketNo,
        subject,
        description,
        category_id,
        priority_id,
        defaultStatusId,
        currentUser.user_code,
        assigned_to_user_code,
        due_date || null,
        Boolean(is_recurring),
        currentUser.user_code,
      ]
    );

    await writeHistory(
      client,
      result.rows[0].ticket_id,
      "created",
      null,
      "Ticket created",
      currentUser.user_code
    );

    await client.query("COMMIT");

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

exports.getTickets = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req, res);

    if (!currentUser) {
      return;
    }

    const params = [currentUser.company_id];
    let accessSql = "";

    if (!isTicketAdmin(currentUser)) {
      params.push(currentUser.user_code);
      accessSql = `
        AND (
          t.raised_by_user_code = $2
          OR t.assigned_to_user_code = $2
        )
      `;
    }

    const result = await pool.query(
      `
      ${ticketSelect}
      WHERE t.company_id = $1
      ${accessSql}
      ORDER BY t.ticket_id DESC
      `,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req, res);

    if (!currentUser) {
      return;
    }

    const { id } = req.params;
    const ticket = await getTicketForUser(id, currentUser);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    res.json(ticket);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateTicket = async (req, res) => {
  const client = await pool.connect();

  try {
    const currentUser = await requireTicketAdmin(req, res);

    if (!currentUser) {
      return;
    }

    const { id } = req.params;

    const {
      subject,
      description,
      priority_id,
      status_id,
      assigned_to_user_code,
    } = req.body;

    await client.query("BEGIN");

    const existing = await client.query(
      `
      SELECT *
      FROM tickets
      WHERE ticket_id = $1
        AND company_id = $2
      `,
      [id, currentUser.company_id]
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (assigned_to_user_code) {
      const assignedUser = await client.query(
        `
        SELECT user_code
        FROM users
        WHERE user_code = $1
          AND company_id = $2
          AND is_active = true
        `,
        [assigned_to_user_code, currentUser.company_id]
      );

      if (assignedUser.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Assigned user is not active in this company",
        });
      }
    }

    const closedStatus = await client.query(
      `
      SELECT is_closed_status
      FROM ticket_statuses
      WHERE status_id = $1
        AND company_id = $2
        AND is_active = true
      `,
      [status_id, currentUser.company_id]
    );

    if (closedStatus.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Ticket status is not active for this company",
      });
    }

    const isClosed = closedStatus.rows[0].is_closed_status;

    const result = await client.query(
      `
      UPDATE tickets
      SET
      subject=$1,
      description=$2,
      priority_id=$3,
      status_id=$4,
      assigned_to_user_code=$5,
      resolved_by_user_code = CASE WHEN $7 THEN $8 ELSE resolved_by_user_code END,
      resolution_date = CASE WHEN $7 THEN CURRENT_TIMESTAMP ELSE resolution_date END,
      user_code=$8,
      update_timestamp=CURRENT_TIMESTAMP
      WHERE ticket_id=$6
      RETURNING *
      `,
      [
        subject,
        description,
        priority_id,
        status_id,
        assigned_to_user_code,
        id,
        isClosed,
        currentUser.user_code,
      ]
    );

    const oldTicket = existing.rows[0];

    await writeHistory(
      client,
      id,
      "assigned_to_user_code",
      oldTicket.assigned_to_user_code,
      assigned_to_user_code,
      currentUser.user_code
    );
    await writeHistory(
      client,
      id,
      "status_id",
      oldTicket.status_id,
      status_id,
      currentUser.user_code
    );
    await writeHistory(
      client,
      id,
      "priority_id",
      oldTicket.priority_id,
      priority_id,
      currentUser.user_code
    );

    await client.query("COMMIT");

    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

exports.assignTicket = async (req, res) => {
  const client = await pool.connect();

  try {
    const currentUser = await requireTicketAdmin(req, res);

    if (!currentUser) {
      return;
    }

    const { id } = req.params;
    const assignedToUserCode =
      req.body.assigned_to_user_code || null;

    await client.query("BEGIN");

    const existing = await client.query(
      `
      SELECT *
      FROM tickets
      WHERE ticket_id = $1
        AND company_id = $2
      `,
      [id, currentUser.company_id]
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (assignedToUserCode) {
      const assignedUser = await client.query(
        `
        SELECT user_code
        FROM users
        WHERE user_code = $1
          AND company_id = $2
          AND is_active = true
        `,
        [assignedToUserCode, currentUser.company_id]
      );

      if (assignedUser.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Assigned user is not active in this company",
        });
      }
    }

    const result = await client.query(
      `
      UPDATE tickets
      SET
        assigned_to_user_code = $1,
        user_code = $2,
        update_timestamp = CURRENT_TIMESTAMP
      WHERE ticket_id = $3
      RETURNING *
      `,
      [assignedToUserCode, currentUser.user_code, id]
    );

    await writeHistory(
      client,
      id,
      "assigned_to_user_code",
      existing.rows[0].assigned_to_user_code,
      assignedToUserCode,
      currentUser.user_code
    );

    await client.query("COMMIT");

    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

exports.takeoverTicket = async (req, res) => {
  req.body.assigned_to_user_code = req.user.userCode;
  return exports.assignTicket(req, res);
};

exports.closeTicket = async (req, res) => {
  const client = await pool.connect();

  try {
    const currentUser = await requireTicketAdmin(req, res);

    if (!currentUser) {
      return;
    }

    const { id } = req.params;

    await client.query("BEGIN");

    const existing = await client.query(
      `
      SELECT *
      FROM tickets
      WHERE ticket_id = $1
        AND company_id = $2
      `,
      [id, currentUser.company_id]
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const closedStatusId = await getClosedStatusId(
      client,
      currentUser.company_id
    );

    if (!closedStatusId) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "No closed ticket status is configured for this company",
      });
    }

    const result = await client.query(
      `
      UPDATE tickets
      SET
        status_id = $1,
        resolved_by_user_code = $2,
        resolution_date = CURRENT_TIMESTAMP,
        user_code = $2,
        update_timestamp = CURRENT_TIMESTAMP
      WHERE ticket_id = $3
      RETURNING *
      `,
      [closedStatusId, currentUser.user_code, id]
    );

    await writeHistory(
      client,
      id,
      "status_id",
      existing.rows[0].status_id,
      closedStatusId,
      currentUser.user_code
    );

    await client.query("COMMIT");

    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const currentUser = await requireTicketAdmin(req, res);

    if (!currentUser) {
      return;
    }

    const { id } = req.params;

    await pool.query(
      `
      DELETE FROM tickets
      WHERE ticket_id=$1
        AND company_id=$2
      `,
      [id, currentUser.company_id]
    );

    res.json({
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
