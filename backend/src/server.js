import express from "express";
import dotenv from "dotenv";
import pool from "./config/db.js"

dotenv.config();

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

app.get("/db-health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.status(200).json({
            success: true,
            database: "Connected",
            serverTime: result.rows[0].now,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            database: "Disconnected",
            error: error.message,
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})