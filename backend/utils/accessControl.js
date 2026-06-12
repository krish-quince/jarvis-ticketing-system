const pool = require("../config/db");

const ADMIN_ROLE_NAMES = new Set(["admin", "manager"]);

const getCurrentUser = async (req) => {
  const result = await pool.query(
    `
    SELECT
      u.user_serial_no,
      u.user_code,
      u.company_id,
      u.role_id,
      u.first_name,
      u.last_name,
      u.email,
      r.role_name
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_serial_no = $1
      AND u.is_active = true
      AND r.is_active = true
    `,
    [req.user.userId]
  );

  return result.rows[0] || null;
};

const isTicketAdmin = (user) =>
  ADMIN_ROLE_NAMES.has(String(user?.role_name || "").toLowerCase());

const requireCurrentUser = async (req, res) => {
  const currentUser = await getCurrentUser(req);

  if (!currentUser) {
    res.status(401).json({
      success: false,
      message: "Active user not found",
    });
    return null;
  }

  return currentUser;
};

const requireTicketAdmin = async (req, res) => {
  const currentUser = await requireCurrentUser(req, res);

  if (!currentUser) {
    return null;
  }

  if (!isTicketAdmin(currentUser)) {
    res.status(403).json({
      success: false,
      message: "Admin access is required for this ticket action",
    });
    return null;
  }

  return currentUser;
};

module.exports = {
  getCurrentUser,
  isTicketAdmin,
  requireCurrentUser,
  requireTicketAdmin,
};
