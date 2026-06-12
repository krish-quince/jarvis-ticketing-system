const pool = require("../config/db");
const { requireCurrentUser } = require("../utils/accessControl");

exports.getTags = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req, res);

    if (!currentUser) {
      return;
    }

    const result = await pool.query(
      `
      SELECT
        tag_id,
        tag_name,
        tag_color
      FROM tags
      WHERE company_id = $1
        AND is_active = true
      ORDER BY tag_name
      `,
      [currentUser.company_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch tags",
    });
  }
};
