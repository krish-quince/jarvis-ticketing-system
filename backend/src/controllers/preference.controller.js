import pool from "../config/db.js";

export const getColumnPreferences = async (req, res) => {
  try {
    const userCode = req.user.userCode;
    const { pageName } = req.params;

    if (!userCode) {
      return res.status(400).json({ success: false, message: "User code is missing from token." });
    }

    const result = await pool.query(
      `SELECT column_key, is_visible 
       FROM user_column_preferences 
       WHERE user_code = $1 AND page_name = $2`,
      [userCode, pageName]
    );

    const preferences = {};
    result.rows.forEach((row) => {
      preferences[row.column_key] = row.is_visible;
    });

    return res.status(200).json(preferences);
  } catch (error) {
    console.error("Error retrieving column preferences:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const saveColumnPreferences = async (req, res) => {
  const client = await pool.connect();
  try {
    const userCode = req.user.userCode;
    const { pageName } = req.params;

    if (!userCode) {
      return res.status(400).json({ success: false, message: "User code is missing from token." });
    }

    await client.query("BEGIN");

    for (const [columnKey, isVisible] of Object.entries(req.body)) {
      await client.query(
        `INSERT INTO user_column_preferences (user_code, page_name, column_key, is_visible)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_code, page_name, column_key)
         DO UPDATE SET is_visible = EXCLUDED.is_visible, updated_at = CURRENT_TIMESTAMP`,
        [userCode, pageName, columnKey, isVisible]
      );
    }

    await client.query("COMMIT");
    return res.status(200).json({ message: "Preferences saved successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving column preferences:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    client.release();
  }
};
