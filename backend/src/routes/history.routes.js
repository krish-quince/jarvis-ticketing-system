import { Router } from "express";

import {
    getTicketHistory
} from "../controllers/history.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/:ticketId/history", verifyToken, getTicketHistory);

export default router;