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

import { validate }
from "../middleware/validation.middleware.js";

import {
    createTicketSchema,
    updateStatusSchema,
    assignTicketSchema,
    updatePrioritySchema,
    updateCategorySchema
}
from "../validators/ticket.validator.js";

const router = Router();

router.get("/:ticketId", verifyToken, getTicketById);

router.post(
    "/",
    verifyToken,
    validate(createTicketSchema),
    createTicket
);
router.get("/", verifyToken, getAllTickets);

router.patch("/:ticketId/status", verifyToken, validate(updateStatusSchema), updateTicketStatus);
router.patch("/:ticketId/assign", verifyToken, validate(assignTicketSchema), assignTicket);
router.patch("/:ticketId/priority", verifyToken, validate(updatePrioritySchema), updateTicketPriority);
router.patch("/:ticketId/category", verifyToken, validate(updateCategorySchema), updateTicketCategory);
router.patch("/:ticketId/resolve", verifyToken, resolveTicket);

export default router;
