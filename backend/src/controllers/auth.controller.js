import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const registerUser = async (req, res) => {
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
            department,
        } = req.body;

        const existingUser = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

        if(existingUser.rows.length > 0) {
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
                company_id,
                role_id,
                user_code,
                first_name,
                last_name,
                email,
                password_hash,
                phone,
                department
            )
            VALUES 
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9
            )
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
                department || "General",
            ]
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
        const {email, password} = req.body;

        const userResult = await pool.query(
            `
            SELECT * FROM users WHERE email = $1
            `, [email]
        );

        if(userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const user =userResult.rows[0];

        const isValidpassword = await bcrypt.compare(password, user.password_hash);

        if(!isValidpassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials.",
            });
        }

        const token = jwt.sign(
            {
                userCode: user.user_code,
                roleId: Number(user.role_id),
                companyId: Number(user.company_id),
                department: user.department || "General",
            },
            process.env.JWT_SECRET, {
                expiresIn: "1d",
            }
        );

        return res.status(200).json({
            success: true,
            token,
            user,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};