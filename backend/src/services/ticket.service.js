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
    if(!statusId) {
        throw new Error("status_id is required.");
    }

    const ticket = await ticketRepository.getTicketById(ticketId, user.companyId);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    const status = await ticketRepository.getStatusByIdAndCompany(statusId, user.companyId);

    if(!status) {
        throw new Error("Status not found.");
    }

    if(String(ticket.status_id) === String(statusId)) {
        return ticket;
    }

    const updatedTicket =  await ticketRepository.updateTicketStatus(ticketId, statusId, user.companyId);

    await historyService.createHistory(
        ticketId, "Status", String(ticket.status_id), String(statusId), user.userCode
    );

    return updatedTicket;
};

export const assignTicket = async (ticketId, assignedToUserCode, user) => {
    if(!assignedToUserCode) {
        throw new Error("assigned_to_user_code is required.");
    }

    const ticket = await ticketRepository.getTicketById(ticketId, user.companyId);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    const assignee = await ticketRepository.getUserByCodeAndCompany(
        assignedToUserCode,
        user.companyId
    );

    if(!assignee) {
        throw new Error("Assigned user not found.");
    }

    const oldValue = ticket.assigned_to_user_code ?? "";

    if(String(oldValue) === String(assignedToUserCode)) {
        return ticket;
    }

    const updatedTicket = await ticketRepository.updateTicketAssignee(
        ticketId,
        assignedToUserCode,
        user.companyId
    );

    await historyService.createHistory(
        ticketId, "AssignedTo", String(oldValue), String(assignedToUserCode), user.userCode
    );

    return updatedTicket;
};

export const updateTicketPriority = async (ticketId, priorityId, user) => {
    if(!priorityId) {
        throw new Error("priority_id is required.");
    }

    const ticket = await ticketRepository.getTicketById(ticketId, user.companyId);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    const priority = await ticketRepository.getPriorityByIdAndCompany(priorityId, user.companyId);

    if(!priority) {
        throw new Error("Priority not found.");
    }

    if(String(ticket.priority_id) === String(priorityId)) {
        return ticket;
    }

    const updatedTicket = await ticketRepository.updateTicketPriority(
        ticketId,
        priorityId,
        user.companyId
    );

    await historyService.createHistory(
        ticketId, "Priority", String(ticket.priority_id), String(priorityId), user.userCode
    );

    return updatedTicket;
};

export const updateTicketCategory = async (ticketId, categoryId, user) => {
    if(!categoryId) {
        throw new Error("category_id is required.");
    }

    const ticket = await ticketRepository.getTicketById(ticketId, user.companyId);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    const category = await ticketRepository.getCategoryByIdAndCompany(categoryId, user.companyId);

    if(!category) {
        throw new Error("Category not found.");
    }

    if(String(ticket.category_id) === String(categoryId)) {
        return ticket;
    }

    const updatedTicket = await ticketRepository.updateTicketCategory(
        ticketId,
        categoryId,
        user.companyId
    );

    await historyService.createHistory(
        ticketId, "Category", String(ticket.category_id), String(categoryId), user.userCode
    );

    return updatedTicket;
};

export const resolveTicket = async (ticketId, statusId, user) => {
    const ticket = await ticketRepository.getTicketById(ticketId, user.companyId);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    const resolvedStatus = statusId
        ? await ticketRepository.getStatusByIdAndCompany(statusId, user.companyId)
        : await ticketRepository.getResolvedStatusByCompany(user.companyId);

    if(!resolvedStatus) {
        throw new Error("Resolved status not found.");
    }

    const oldResolvedBy = ticket.resolved_by_user_code ?? "";
    const nextStatusId = resolvedStatus.status_id;

    if(oldResolvedBy === user.userCode && String(ticket.status_id) === String(nextStatusId)) {
        return ticket;
    }

    const updatedTicket = await ticketRepository.resolveTicket(
        ticketId,
        user.userCode,
        nextStatusId,
        user.companyId
    );

    if(String(ticket.status_id) !== String(nextStatusId)) {
        await historyService.createHistory(
            ticketId, "Status", String(ticket.status_id), String(nextStatusId), user.userCode
        );
    }

    if(oldResolvedBy !== user.userCode) {
        await historyService.createHistory(
            ticketId, "Resolution", String(oldResolvedBy), String(user.userCode), user.userCode
        );
    }

    return updatedTicket;
};
