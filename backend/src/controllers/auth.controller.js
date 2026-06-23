import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const registerUser = async (req, res) => {
  try {
    const {
      company_code,
      user_code,
      first_name,
      last_name,
      email,
      password,
      phone,
      department_id,
    } = req.body;

    const roleResult = await pool.query(
    `
    SELECT role_id
    FROM roles
    WHERE LOWER(role_name) = LOWER('Employee')
    LIMIT 1
    `
    );

    if (roleResult.rows.length === 0) {
        return res.status(500).json({
            success: false,
            message: "Employee role not found",
        });
    }

    const role_id = roleResult.rows[0].role_id;

    const existingUser = await pool.query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`,
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
            INSERT INTO users 
            (
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
            VALUES 
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9
            )
            RETURNING *
            `,
      [
        company_code,
        role_id,
        user_code,
        first_name,
        last_name,
        email,
        hashedPassword,
        phone,
        department_id,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "user registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { user_code, password } = req.body;

    const columnResult = await pool.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name IN ('company_code', 'company_id', 'department_id', 'department')
      `,
    );
    const userColumns = new Set(columnResult.rows.map((row) => row.column_name));
    const hasCompanyCode = userColumns.has("company_code");
    const hasCompanyId = userColumns.has("company_id");
    const hasDepartmentId = userColumns.has("department_id");
    const hasDepartment = userColumns.has("department");

    const companySelect = hasCompanyCode
      ? "u.company_code"
      : hasCompanyId
        ? "c.company_code"
        : "NULL";
    const companyJoin = "LEFT JOIN companies c ON c.company_code = u.company_code";
    const departmentSelect = hasDepartmentId
      ? "u.department_id"
      : hasDepartment
        ? "NULL"
        : "NULL";

    const userResult = await pool.query(
      `
            SELECT
              u.*,
              r.role_name,
              c.company_name,
              c.logo_url,
              ${companySelect} AS resolved_company_code,
              ${departmentSelect} AS resolved_department_id
            FROM users u
            INNER JOIN roles r ON r.role_id = u.role_id
            ${companyJoin}
            WHERE u.user_code = $1 OR u.email = $1
            `,
      [user_code],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = userResult.rows[0];

    if (user.resolved_company_code) {
      const companyRes = await pool.query(
        `SELECT is_deleted FROM companies WHERE company_code = $1`,
        [user.resolved_company_code]
      );
      if (companyRes.rows.length > 0 && companyRes.rows[0].is_deleted) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Your company account has been deactivated.",
        });
      }
    }

    const isValidpassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidpassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const normalizedUser = {
      ...user,
      company_code: user.resolved_company_code,
      department_id: user.resolved_department_id,
      company_name: user.company_name,
      logo_url: user.logo_url,
    };

    const token = jwt.sign(
      {
        userCode: user.user_code,
        roleId: Number(user.role_id),
        roleName: user.role_name,
        companyCode: normalizedUser.company_code,
        departmentId: normalizedUser.department_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    return res.status(200).json({
      success: true,
      token,
      user: normalizedUser,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
