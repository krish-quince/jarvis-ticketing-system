import pool from "../config/db.js";

export const getAllUsers = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        const result = await pool.query(
            `
            SELECT u.user_code, u.first_name, u.last_name, u.email, r.role_name AS role_id
            FROM users u
            INNER JOIN roles r ON r.role_id = u.role_id
            WHERE u.company_id = $1 AND u.is_active = true
            ORDER BY u.user_serial_no ASC
            `,
            [companyId]
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
