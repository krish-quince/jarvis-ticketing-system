const pool = require("../config/db");
const { requireCurrentUser } = require("../utils/accessControl");

exports.getPriorities = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req, res);

    if (!currentUser) {
      return;
    }

    const result = await pool.query(
      `
      SELECT
        priority_id,
        priority_name,
        priority_color,
        priority_value
      FROM ticket_priorities
      WHERE company_id = $1
        AND is_active = true
      ORDER BY priority_value
      `,
      [currentUser.company_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch priorities",
    });
  }
};
