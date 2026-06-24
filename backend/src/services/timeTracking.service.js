import * as timeTrackingRepo from "../repositories/timeTracking.repository.js";

/**
 * Start a new time tracking session for a ticket.
 */
export const startTimer = async (ticketId, userCode, statusName) => {
    const entry = await timeTrackingRepo.createEntry(ticketId, userCode, statusName);
    return entry;
};

/**
 * Stop a time tracking session.
 */
export const stopTimer = async (entryId, timeSpentSeconds) => {
    const entry = await timeTrackingRepo.closeEntry(entryId, timeSpentSeconds);
    return entry;
};

/**
 * Get all time entries for a ticket.
 */
export const getTimeEntries = async (ticketId) => {
    const entries = await timeTrackingRepo.getEntriesByTicket(ticketId);
    return entries;
};

/**
 * Get total time spent on a ticket.
 */
export const getTotalTime = async (ticketId) => {
    const totalSeconds = await timeTrackingRepo.getTotalTimeByTicket(ticketId);
    return totalSeconds;
};
