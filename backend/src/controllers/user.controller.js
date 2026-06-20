import bcrypt from "bcrypt";
import pool from "../config/db.js";

export const getAllUsers = async (req, res) => {
    try {
        const companyCode = req.user.companyCode;

        const result = await pool.query(
            `
            SELECT u.user_code, u.first_name, u.last_name, u.email, r.role_name AS role_id
            FROM users u
            INNER JOIN roles r ON r.role_id = u.role_id
            WHERE u.company_code = $1 AND u.is_active = true
            ORDER BY u.user_serial_no ASC
            `,
            [companyCode]
        );

        return res.status(200).json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getAllUsersWithData = async (req, res) => {
    try {
        const companyCode = req.user.companyCode;

        const result = await pool.query(
            `
            SELECT u.user_code, u.first_name, u.last_name, u.email, r.role_id, r.role_name, c.company_name, c.company_code, d.department_name
            FROM users u
            INNER JOIN roles r ON r.role_id = u.role_id
            INNER JOIN companies c ON c.company_code = u.company_code
            INNER JOIN departments d ON d.department_id = u.department_id
            WHERE u.company_code = $1 AND u.is_active = true
            ORDER BY u.user_serial_no ASC
            `,
            [companyCode]
        );

        return res.status(200).json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateUser = async (req, res) => {
  try {
    const { userCode } = req.params;

    const {
      first_name,
      last_name,
      role_id,
      company_code,
      department_id,
      is_active,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET
        first_name = $1,
        last_name = $2,
        role_id = $3,
        company_code = $4,
        department_id = $5,
        is_active = $6,
        update_timestamp = NOW()
      WHERE user_code = $7
      RETURNING *
      `,
      [
        first_name,
        last_name,
        role_id,
        company_code,
        department_id,
        is_active,
        userCode,
      ]
    );

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      user_code,
      first_name,
      last_name,
      email,
      password,
      phone,
      role_id,
      company_code,
      department_id,
    } = req.body;

    if (!user_code || !email || !password || !role_id || !company_code) {
      return res.status(400).json({
        success: false,
        message: "Username, email, password, role, and company are required.",
      });
    }

    const existingUser = await pool.query(
      `
      SELECT user_code, email
      FROM users
      WHERE LOWER(user_code) = LOWER($1)
         OR LOWER(email) = LOWER($2)
      LIMIT 1
      `,
      [user_code, email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A user with this username or email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (
        company_code,
        role_id,
        user_code,
        first_name,
        last_name,
        email,
        password_hash,
        phone,
        department_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING user_code, first_name, last_name, email, role_id, company_code, department_id, is_active
      `,
      [
        company_code,
        role_id,
        user_code,
        first_name || user_code,
        last_name || null,
        email,
        hashedPassword,
        phone || null,
        department_id || null,
      ],
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
