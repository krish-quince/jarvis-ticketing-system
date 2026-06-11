import * as ticketRepository from "../repositories/ticket.repository.js";

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