const pool = require("../config/db");
const { requireCurrentUser } = require("../utils/accessControl");

exports.getStatuses = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req, res);

    if (!currentUser) {
      return;
    }

    const result = await pool.query(
      `
      SELECT
        status_id,
        status_name,
        status_color,
        display_order,
        is_default,
        is_closed_status
      FROM ticket_statuses
      WHERE company_id = $1
        AND is_active = true
      ORDER BY display_order, status_id
      `,
      [currentUser.company_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch statuses",
    });
  }
};
