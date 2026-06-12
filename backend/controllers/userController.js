const pool = require("../config/db");
const bcrypt = require("bcrypt");
const {
  isTicketAdmin,
  requireCurrentUser,
  requireTicketAdmin,
} = require("../utils/accessControl");

exports.getAllUsers = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req, res);

    if (!currentUser) {
      return;
    }

    const params = [currentUser.company_id];
    let accessSql = "WHERE u.company_id = $1";

    if (!isTicketAdmin(currentUser)) {
      params.push(currentUser.user_code);
      accessSql += " AND u.user_code = $2";
    }

    const result = await pool.query(
      `
      SELECT
        u.user_serial_no,
        u.user_code,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role_id,
        r.role_name,
        u.company_id,
        u.is_active
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      ${accessSql}
      ORDER BY u.user_serial_no
      `,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUserByCode = async (req, res) => {
  try {
    const currentUser = await requireCurrentUser(req, res);

    if (!currentUser) {
      return;
    }

    const { userCode } = req.params;

    const result = await pool.query(
      `
      SELECT
        u.user_serial_no,
        u.user_code,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role_id,
        r.role_name,
        u.company_id,
        u.is_active
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_code = $1
        AND u.company_id = $2
      `,
      [userCode, currentUser.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const currentUser = await requireTicketAdmin(req, res);

    if (!currentUser) {
      return;
    }

    const {
      role_id,
      user_code,
      first_name,
      last_name,
      email,
      password,
      phone,
    } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users
      (
        company_id,
        role_id,
        user_code,
        first_name,
        last_name,
        email,
        password_hash,
        phone
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        currentUser.company_id,
        role_id,
        user_code,
        first_name,
        last_name,
        email,
        hash,
        phone,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const currentUser = await requireTicketAdmin(req, res);

    if (!currentUser) {
      return;
    }

    const { userCode } = req.params;

    const {
      first_name,
      last_name,
      phone,
      role_id,
      is_active,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET
      first_name=$1,
      last_name=$2,
      phone=$3,
      role_id=$4,
      is_active=$5,
      update_timestamp=CURRENT_TIMESTAMP
      WHERE user_code=$6
        AND company_id=$7
      RETURNING *
      `,
      [
        first_name,
        last_name,
        phone,
        role_id,
        is_active,
        userCode,
        currentUser.company_id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const currentUser = await requireTicketAdmin(req, res);

    if (!currentUser) {
      return;
    }

    const { userCode } = req.params;

    await pool.query(
      `
      DELETE FROM users
      WHERE user_code=$1
        AND company_id=$2
      `,
      [userCode, currentUser.company_id]
    );

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
