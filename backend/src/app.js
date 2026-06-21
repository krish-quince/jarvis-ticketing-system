import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import pool from "./config/db.js"
import path from "path";
import { fileURLToPath } from "url";


import authRoutes from "./routes/auth.routes.js";

import { verifyToken } from "./middleware/auth.middleware.js";

import ticketRoutes from "./routes/ticket.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import historyRoutes from "./routes/history.routes.js";
import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import masterRoutes from "./routes/master.routes.js";

dotenv.config();

const app = express();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const uploadsDirectory = path.resolve(currentDirectory, "../uploads");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(
    "/uploads",
    express.static(uploadsDirectory, {
        setHeaders: (res) => {
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        },
    }),
);

app.use("/api/auth", authRoutes);

app.use("/api/tickets", ticketRoutes);

app.use("/api/tickets", commentRoutes);

app.use("/api/tickets", historyRoutes);

app.use("/api/users", userRoutes);

app.use("/api/dashboard", dashboardRoutes);

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

app.get("/profile", verifyToken, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
});

app.use(
  "/api/master",
  masterRoutes
);

export default app;
