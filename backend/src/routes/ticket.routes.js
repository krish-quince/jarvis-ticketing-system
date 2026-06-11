import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
    createTicket, getAllTickets,
} from "../controllers/ticket.controller.js";

const router = Router();

router.post("/", verifyToken, createTicket);
router.get("/", verifyToken, getAllTickets);

export default router;
