const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/*
=========================================
REGISTER
=========================================
*/

exports.register = async (req, res) => {
  console.log("========== REGISTER API HIT ==========");
  console.log("Request Body:", req.body);

  try {
    const {
      company_id,
      role_id,
      user_code,
      first_name,
      last_name,
      email,
      password,
      phone,
    } = req.body;

    // Validation
    if (
      !company_id ||
      !role_id ||
      !user_code ||
      !first_name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }

    console.log("Checking existing email...");

    const existing = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    console.log("Hashing password...");

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Inserting user into database...");

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
        company_id,
        role_id,
        user_code,
        first_name,
        last_name,
        email,
        hashedPassword,
        phone,
      ]
    );

    console.log("User Created:", result.rows[0]);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.log("========== REGISTER ERROR ==========");
    console.log("Message:", error.message);
    console.log("Code:", error.code);
    console.log("Detail:", error.detail);
    console.log("Full Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      detail: error.detail || null,
      code: error.code || null,
    });
  }
};

/*
=========================================
LOGIN
=========================================
*/

exports.login = async (req, res) => {
  console.log("========== LOGIN API HIT ==========");

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and Password are required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        u.*,
        r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.email = $1
        AND u.is_active = true
        AND r.is_active = true
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!match) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: user.user_serial_no,
        userCode: user.user_code,
        roleId: user.role_id,
        companyId: user.company_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        userId: user.user_serial_no,
        userCode: user.user_code,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        roleId: user.role_id,
        roleName: user.role_name,
        companyId: user.company_id,
      },
    });
  } catch (error) {
    console.log("========== LOGIN ERROR ==========");
    console.log("Message:", error.message);
    console.log("Code:", error.code);
    console.log("Detail:", error.detail);
    console.log("Full Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      detail: error.detail || null,
      code: error.code || null,
    });
  }
};


exports.profile = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        u.user_serial_no,
        u.user_code,
        u.first_name,
        u.last_name,
        u.email,
        u.role_id,
        r.role_name,
        u.company_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_serial_no = $1
      `,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};
