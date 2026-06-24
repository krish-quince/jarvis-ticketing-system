import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
    startTimer,
    stopTimer,
    getTimeEntries,
    getTotalTime,
} from "../controllers/timeTracking.controller.js";

const router = Router();

// Start a new time tracking session
router.post("/:ticketId/time-tracking/start", verifyToken, startTimer);

// Stop a time tracking session
router.patch("/:ticketId/time-tracking/:entryId/stop", verifyToken, stopTimer);

// Get all time entries for a ticket
router.get("/:ticketId/time-tracking", verifyToken, getTimeEntries);

// Get total time spent on a ticket
router.get("/:ticketId/time-tracking/total", verifyToken, getTotalTime);

export default router;
