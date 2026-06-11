import * as historyRepository from "../repositories/history.repository.js";

export const createHistory = async(ticketId, fieldName, oldValue, newValue, userCode) => {
    return await historyRepository.createHistory(ticketId, fieldName, oldValue, newValue, userCode);
};

export const getTicketHistory = async(ticketId) => {
    return await historyRepository.getTicketHistory(ticketId);
};