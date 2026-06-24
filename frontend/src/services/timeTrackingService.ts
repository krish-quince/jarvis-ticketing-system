import API from "./api";

const unwrapData = (responseData: any) => responseData.data ?? responseData;

/**
 * Start a new time tracking session for a ticket.
 */
export const startTimeTracking = async (ticketId: number, statusName?: string) => {
    const response = await API.post(`/tickets/${ticketId}/time-tracking/start`, {
        status_name: statusName || null,
    });
    return unwrapData(response.data);
};

/**
 * Stop a time tracking session.
 */
export const stopTimeTracking = async (
    ticketId: number,
    entryId: number,
    timeSpentSeconds: number
) => {
    const response = await API.patch(
        `/tickets/${ticketId}/time-tracking/${entryId}/stop`,
        { time_spent_seconds: timeSpentSeconds }
    );
    return unwrapData(response.data);
};

/**
 * Get all time entries for a ticket.
 */
export const getTimeEntries = async (ticketId: number) => {
    const response = await API.get(`/tickets/${ticketId}/time-tracking`);
    return unwrapData(response.data);
};

/**
 * Get total time spent on a ticket.
 */
export const getTotalTime = async (ticketId: number): Promise<number> => {
    const response = await API.get(`/tickets/${ticketId}/time-tracking/total`);
    const data = unwrapData(response.data);
    return Number(data?.total_seconds) || 0;
};
