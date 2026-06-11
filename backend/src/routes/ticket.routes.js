import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
    createTicket, getAllTickets, getTicketById
} from "../controllers/ticket.controller.js";

const router = Router();

router.get("/:ticketId", verifyToken, getTicketById);

router.post("/", verifyToken, createTicket);
router.get("/", verifyToken, getAllTickets);

export default router;
