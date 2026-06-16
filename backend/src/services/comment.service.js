import * as commmentRepository from "../repositories/comment.repository.js";

export const createComment = async(ticketId, commentText, user) => {

    const ticket = await commmentRepository.getTicketById(ticketId, user.companyCode);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    if (user && Number(user.roleId) !== 1 &&
        ticket.assigned_to_user_code !== user.userCode &&
        ticket.raised_by_user_code !== user.userCode &&
        Number(ticket.department_id) !== Number(user.departmentId)) {
        throw new Error("Access denied to this ticket.");
    }

    return await commmentRepository.createComment(
        ticketId, user.userCode, commentText
    );
};

export const getCommentsByTicketId = async(ticketId, user) => {
    const ticket = await commmentRepository.getTicketById(ticketId, user.companyCode);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    if (user && Number(user.roleId) !== 1 &&
        ticket.assigned_to_user_code !== user.userCode &&
        ticket.raised_by_user_code !== user.userCode &&
        Number(ticket.department_id) !== Number(user.departmentId)) {
        throw new Error("Access denied to this ticket.");
    }

    return await commmentRepository.getCommentsByTicketId(ticketId, user.companyCode);
};
