import * as commmentRepository from "../repositories/comment.repository.js";

export const createComment = async(ticketId, commentText, user) => {

    const ticket = await commmentRepository.getTicketById(ticketId, user.companyId);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    return await commmentRepository.createComment(
        ticketId, user.userCode, commentText
    );
};

export const getCommentsByTicketId = async(ticketId, user) => {
    const ticket = await commmentRepository.getTicketById(ticketId, user.companyId);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    return await commmentRepository.getCommentsByTicketId(ticketId, user.companyId);
};
