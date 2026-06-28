import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { sendWelcomeEmail } from "../services/email.service.js";

export const getAllUsers = async (req, res) => {
    try {
        const isSuperAdmin = Number(req.user.roleId) === 4;
        const targetCompanyCode = isSuperAdmin ? (req.query.companyCode || null) : req.user.companyCode;

        let query = `
            SELECT u.user_code, u.first_name, u.last_name, u.email, r.role_name AS role_id
            FROM users u
            INNER JOIN roles r ON r.role_id = u.role_id
            WHERE u.is_active = true
        `;
        const params = [];
        let paramIndex = 1;
        if (targetCompanyCode) {
            query += ` AND u.company_code = $${paramIndex}`;
            params.push(targetCompanyCode);
            paramIndex++;
        }
        if (!isSuperAdmin) {
            query += ` AND u.role_id != 4`;
        }
        query += ` ORDER BY u.user_serial_no ASC`;

        const result = await pool.query(query, params);

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
        const isSuperAdmin = Number(req.user.roleId) === 4;
        const targetCompanyCode = isSuperAdmin ? (req.query.companyCode || null) : req.user.companyCode;

        let query = `
            SELECT u.user_code, u.first_name, u.last_name, u.email, r.role_id, r.role_name, c.company_name, c.company_code, d.department_name
            FROM users u
            INNER JOIN roles r ON r.role_id = u.role_id
            LEFT JOIN companies c ON c.company_code = u.company_code
            LEFT JOIN departments d ON d.department_id = u.department_id
            WHERE u.is_active = true
        `;
        const params = [];
        let paramIndex = 1;
        if (targetCompanyCode) {
            query += ` AND u.company_code = $${paramIndex}`;
            params.push(targetCompanyCode);
            paramIndex++;
        }
        if (!isSuperAdmin) {
            query += ` AND u.role_id != 4`;
        }
        query += ` ORDER BY u.user_serial_no ASC`;

        const result = await pool.query(query, params);

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

    const targetUserRes = await pool.query(
      "SELECT role_id FROM users WHERE user_code = $1",
      [userCode]
    );
    if (targetUserRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const targetUser = targetUserRes.rows[0];
    const isSuperAdmin = Number(req.user.roleId) === 4;

    // Check permissions
    if (Number(targetUser.role_id) === 4 && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admins can edit Super Admin users.",
      });
    }
    if (Number(role_id) === 4 && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admins can assign the Super Admin role.",
      });
    }

    let finalCompanyCode = isSuperAdmin ? company_code : req.user.companyCode;
    let finalDepartmentId = department_id;

    if (Number(role_id) === 4) {
      finalCompanyCode = null;
      finalDepartmentId = null;

      // Naming format check
      const companiesRes = await pool.query("SELECT company_code FROM companies");
      for (const row of companiesRes.rows) {
        const code = row.company_code.toLowerCase();
        if (userCode.toLowerCase().startsWith(code + "_") || userCode.toLowerCase() === code) {
          return res.status(400).json({
            success: false,
            message: `Super Admin username cannot contain or be prefixed with the company code '${row.company_code}'.`
          });
        }
      }
    }

    let query = `
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
    `;
    const params = [
      first_name,
      last_name,
      role_id,
      finalCompanyCode,
      finalDepartmentId,
      is_active,
      userCode,
    ];

    if (!isSuperAdmin) {
      query += ` AND company_code = $8`;
      params.push(req.user.companyCode);
    }

    query += ` RETURNING *`;
    const result = await pool.query(query, params);

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

    const isSuperAdmin = Number(req.user.roleId) === 4;
    const targetRoleId = Number(role_id);

    if (targetRoleId === 4 && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admins can create Super Admin accounts.",
      });
    }

    const isCreatingSuperAdmin = targetRoleId === 4;
    if (!user_code || !email || !password || !role_id || (!company_code && !isCreatingSuperAdmin)) {
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

    let finalCompanyCode = isSuperAdmin ? company_code : req.user.companyCode;
    let finalDepartmentId = department_id || null;

    if (isCreatingSuperAdmin) {
      finalCompanyCode = null;
      finalDepartmentId = null;

      // Naming format check
      const companiesRes = await pool.query("SELECT company_code FROM companies");
      for (const row of companiesRes.rows) {
        const code = row.company_code.toLowerCase();
        if (user_code.toLowerCase().startsWith(code + "_") || user_code.toLowerCase() === code) {
          return res.status(400).json({
            success: false,
            message: `Super Admin username cannot contain or be prefixed with the company code '${row.company_code}'.`
          });
        }
      }
    }

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
        finalCompanyCode,
        role_id,
        user_code,
        first_name || user_code,
        last_name || null,
        email,
        hashedPassword,
        phone || null,
        finalDepartmentId,
      ],
    );

    // Send welcome email with credentials in background
    sendWelcomeEmail({
      email,
      user_code,
      password, // Pass plain text temporary password
      first_name: first_name || user_code,
      last_name: last_name || null,
      role_id,
      company_code: finalCompanyCode,
      department_id: finalDepartmentId
    }).catch(err => {
      console.error("Welcome email async trigger failed:", err);
    });

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

export const getUserByCodeDetail = async (req, res) => {
    try {
        const { userCode } = req.params;
        const query = `
            SELECT u.user_code, u.first_name, u.last_name, u.email, r.role_id, r.role_name, c.company_name, c.company_code, d.department_name, u.is_active
            FROM users u
            INNER JOIN roles r ON r.role_id = u.role_id
            LEFT JOIN companies c ON c.company_code = u.company_code
            LEFT JOIN departments d ON d.department_id = u.department_id
            WHERE u.user_code = $1
        `;
        const result = await pool.query(query, [userCode]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
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

export const searchUsers = async (req, res) => {
    try {
        const { q = "" } = req.query;
        if (q.trim().length < 2) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const isSuper = Number(req.user.roleId) === 4;
        const searchPattern = `%${q.trim()}%`;
        
        let query = `
            SELECT u.user_code, u.first_name, u.last_name, u.email, c.company_name
            FROM public.users u
            LEFT JOIN public.companies c ON c.company_code = u.company_code
            WHERE u.is_active = true
              AND (
                LOWER(u.first_name) LIKE LOWER($1)
                OR LOWER(u.last_name) LIKE LOWER($1)
                OR LOWER(u.first_name || ' ' || u.last_name) LIKE LOWER($1)
                OR LOWER(u.email) LIKE LOWER($1)
                OR LOWER(u.user_code) LIKE LOWER($1)
              )
        `;
        const params = [searchPattern];

        if (!isSuper) {
            query += ` AND u.company_code = $2`;
            params.push(req.user.companyCode);
        }

        query += ` LIMIT 10`;

        const result = await pool.query(query, params);
        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error("searchUsers error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
