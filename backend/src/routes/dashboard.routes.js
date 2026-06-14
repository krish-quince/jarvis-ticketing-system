import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { getSummary } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/summary", verifyToken, getSummary);

export default router;
