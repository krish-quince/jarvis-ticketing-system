import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization header missing",
            });
        }

        const token = authHeader.split(" ")[1];

        if(!token) {
            return res.status(401).json({
                success: false,
                message: "Token missing",
            });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);

        if (decode.companyCode) {
            const companyRes = await pool.query(
                `SELECT is_deleted FROM companies WHERE company_code = $1`,
                [decode.companyCode]
            );
            if (companyRes.rows.length > 0 && companyRes.rows[0].is_deleted) {
                return res.status(401).json({
                    success: false,
                    message: "Access denied. Your company account has been deactivated.",
                });
            }
        }

        req.user = decode;

        next();
    } catch (error) {

    if (error.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Token expired",
        });
    }

    return res.status(401).json({
        success: false,
        message: "Invalid token",
    });
}
};