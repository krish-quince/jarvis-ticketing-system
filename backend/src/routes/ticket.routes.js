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
    reopenTicket
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
router.patch("/:ticketId/takeover", verifyToken, takeoverTicket);
router.patch("/:ticketId/reopen", verifyToken, reopenTicket);
router.delete("/attachments/:type/:attachmentId", verifyToken, deleteAttachment);



export default router;
