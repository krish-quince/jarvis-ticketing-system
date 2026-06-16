import * as historyRepository from "../repositories/history.repository.js";

export const createHistory = async(ticketId, fieldName, oldValue, newValue, userCode, client = null) => {
    return await historyRepository.createHistory(ticketId, fieldName, oldValue, newValue, userCode, client);
};

export const getTicketHistory = async(ticketId, companyCode) => {
    return await historyRepository.getTicketHistory(ticketId, companyCode);
};
