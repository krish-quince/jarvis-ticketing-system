import * as ticketRepository from "../repositories/ticket.repository.js";

import * as historyService from "./history.service.js";

export const createTicket = async(ticketData, user) => {
    const ticketNo = `TKT-${Date.now()}`;

    const payload = {
        ...ticketData,
        ticketNo,
        raisedByUserCode: user.userCode,
        companyId: user.companyId,
    };

    return await ticketRepository.createTicket(payload);
};

export const getAllTickets = async(companyId) => {
    return await ticketRepository.getAllTickets(companyId);
};

export const getTicketById = async (ticketId, companyId) => {
    return await ticketRepository.getTicketById(ticketId, companyId);
};

export const updateTicketStatus = async (ticketId, statusId, user) => {
    const ticket = await ticketRepository.getTicketById(ticketId, user.companyId);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    await ticketRepository.updateStatus(ticketId, newStatusId);

    await historyService.createHistory(ticketId, "Status", String(ticket.status_id), String(newStatusId), user.userCode);
};