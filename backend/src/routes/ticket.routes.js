import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
    assignTicket,
    allocateTicket,
    createTicket,
    getAllTickets,
    getTicketById,
    resolveTicket,
    updateTicketCategory,
    updateTicketPriority,
    updateTicketStatus,
    takeoverTicket,
    updateTicketDueDate,
    deleteAttachment,
    reopenTicket,
    toggleTicketPin,
    deleteTicket
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

import { recurrenceSchema } from "../validators/recurrence.validator.js";
import {
    getTicketRecurrence,
    createTicketRecurrence,
    updateTicketRecurrence,
    deleteTicketRecurrence
} from "../controllers/recurrence.controller.js";

import { uploadTicketAttachments } from "../middleware/ticketUpload.middleware.js";



const router = Router();

router.get("/:ticketId", verifyToken, getTicketById);

router.post(
    "/",
    verifyToken,
    uploadTicketAttachments.array("attachments", 10),
    validate(createTicketSchema),
    createTicket
);
router.get("/", verifyToken, getAllTickets);

router.patch("/:ticketId/status", verifyToken, validate(updateStatusSchema), updateTicketStatus);
router.patch("/:ticketId/assign", verifyToken, validate(assignTicketSchema), assignTicket);
router.patch("/:ticketId/allocate", verifyToken, allocateTicket);
router.patch("/:ticketId/priority", verifyToken, validate(updatePrioritySchema), updateTicketPriority);
router.patch("/:ticketId/category", verifyToken, validate(updateCategorySchema), updateTicketCategory);
router.patch("/:ticketId/resolve", verifyToken, resolveTicket);
router.patch(
  "/:ticketId/due-date",
  verifyToken,
  updateTicketDueDate
);
router.patch("/:ticketId/pin", verifyToken, toggleTicketPin);
router.patch("/:ticketId/takeover", verifyToken, takeoverTicket);
router.patch("/:ticketId/reopen", verifyToken, reopenTicket);
router.delete("/attachments/:type/:attachmentId", verifyToken, deleteAttachment);
router.delete("/:ticketId", verifyToken, deleteTicket);

// Recurrence settings routes
router.get("/:ticketId/recurrence", verifyToken, getTicketRecurrence);
router.post("/:ticketId/recurrence", verifyToken, validate(recurrenceSchema), createTicketRecurrence);
router.put("/:ticketId/recurrence", verifyToken, validate(recurrenceSchema), updateTicketRecurrence);
router.delete("/:ticketId/recurrence", verifyToken, deleteTicketRecurrence);

export default router;
