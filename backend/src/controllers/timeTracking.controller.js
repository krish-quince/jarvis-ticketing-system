import * as timeTrackingService from "../services/timeTracking.service.js";

/**
 * POST /api/tickets/:ticketId/time-tracking/start
 * Start a new time tracking session.
 */
export const startTimer = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status_name } = req.body;
        const userCode = req.user.userCode;

        const entry = await timeTrackingService.startTimer(
            Number(ticketId),
            userCode,
            status_name || null
        );

        return res.status(201).json({
            success: true,
            data: entry,
        });
    } catch (error) {
        console.error("startTimer error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * PATCH /api/tickets/:ticketId/time-tracking/:entryId/stop
 * Stop a time tracking session.
 */
export const stopTimer = async (req, res) => {
    try {
        const { entryId } = req.params;
        const { time_spent_seconds } = req.body;

        const entry = await timeTrackingService.stopTimer(
            Number(entryId),
            Number(time_spent_seconds) || 0
        );

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "Time entry not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: entry,
        });
    } catch (error) {
        console.error("stopTimer error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /api/tickets/:ticketId/time-tracking
 * Get all time entries for a ticket.
 */
export const getTimeEntries = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const entries = await timeTrackingService.getTimeEntries(Number(ticketId));

        return res.status(200).json({
            success: true,
            data: entries,
        });
    } catch (error) {
        console.error("getTimeEntries error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /api/tickets/:ticketId/time-tracking/total
 * Get total time spent on a ticket.
 */
export const getTotalTime = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const totalSeconds = await timeTrackingService.getTotalTime(Number(ticketId));

        return res.status(200).json({
            success: true,
            data: { total_seconds: totalSeconds },
        });
    } catch (error) {
        console.error("getTotalTime error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
