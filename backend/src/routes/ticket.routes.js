import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
    assignTicket,
    createTicket,
    getAllTickets,
    getTicketById,
    resolveTicket,
    updateTicketCategory,
    updateTicketPriority,
    updateTicketStatus
} from "../controllers/ticket.controller.js";

const router = Router();

router.get("/:ticketId", verifyToken, getTicketById);

router.post("/", verifyToken, createTicket);
router.get("/", verifyToken, getAllTickets);

router.patch("/:ticketId/status", verifyToken, updateTicketStatus);
router.patch("/:ticketId/assign", verifyToken, assignTicket);
router.patch("/:ticketId/priority", verifyToken, updateTicketPriority);
router.patch("/:ticketId/category", verifyToken, updateTicketCategory);
router.patch("/:ticketId/resolve", verifyToken, resolveTicket);

export default router;
