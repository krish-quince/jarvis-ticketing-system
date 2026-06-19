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
            SELECT *
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