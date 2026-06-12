const pool = require("../config/db");
const {
  isTicketAdmin,
  requireCurrentUser,
} = require("../utils/accessControl");

exports.getDashboardSummary = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req, res);

    if (!currentUser) {
      return;
    }

    const params = [currentUser.company_id];
    let accessSql = "WHERE t.company_id = $1";

    if (!isTicketAdmin(currentUser)) {
      params.push(currentUser.user_code);
      accessSql += `
        AND (
          t.raised_by_user_code = $2
          OR t.assigned_to_user_code = $2
        )
      `;
    }

    const totalTickets = await pool.query(
      `
      SELECT COUNT(*)
      FROM tickets t
      ${accessSql}
      `,
      params
    );

    const openTickets = await pool.query(
      `
      SELECT COUNT(*)
      FROM tickets t
      JOIN ticket_statuses ts
      ON t.status_id = ts.status_id
      ${accessSql}
        AND ts.is_default = true
      `,
      params
    );

    const inProgressTickets = await pool.query(
      `
      SELECT COUNT(*)
      FROM tickets t
      JOIN ticket_statuses ts
      ON t.status_id = ts.status_id
      ${accessSql}
        AND ts.is_default = false
        AND ts.is_closed_status = false
      `,
      params
    );

    const closedTickets = await pool.query(
      `
      SELECT COUNT(*)
      FROM tickets t
      JOIN ticket_statuses ts
      ON t.status_id = ts.status_id
      ${accessSql}
        AND ts.is_closed_status = true
      `,
      params
    );

    res.json({
      totalTickets:
        totalTickets.rows[0].count,

      openTickets:
        openTickets.rows[0].count,

      inProgressTickets:
        inProgressTickets.rows[0].count,

      closedTickets:
        closedTickets.rows[0].count,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};
