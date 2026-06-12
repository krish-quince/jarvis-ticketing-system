const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  assignTicket,
  takeoverTicket,
  closeTicket,
  deleteTicket,
} = require("../controllers/ticketController");

router.post("/", authMiddleware, createTicket);

router.get("/", authMiddleware, getTickets);

router.get("/:id", authMiddleware, getTicketById);

router.patch("/:id/assign", authMiddleware, assignTicket);

router.patch("/:id/takeover", authMiddleware, takeoverTicket);

router.patch("/:id/close", authMiddleware, closeTicket);

router.put("/:id", authMiddleware, updateTicket);

router.delete("/:id", authMiddleware, deleteTicket);

module.exports = router;
