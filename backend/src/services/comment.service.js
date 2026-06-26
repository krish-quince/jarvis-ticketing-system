import * as commmentRepository from "../repositories/comment.repository.js";
import { canAccessTicket, canManageTicket } from "../utils/ticketPermissions.js";

export const createComment = async(ticketId, commentText, user, files = []) => {

    const ticket = await commmentRepository.getTicketById(ticketId, user.companyCode);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    if (!canManageTicket(ticket, user)) {
        throw new Error("Access denied. Only the assignee, creator, or admins can chat.");
    }

    return await commmentRepository.createCommentWithAttachments(
        ticketId, user.userCode, commentText, files
    );
};

export const getCommentsByTicketId = async(ticketId, user) => {
    const ticket = await commmentRepository.getTicketById(ticketId, user.companyCode);

    if(!ticket) {
        throw new Error("Ticket not found.");
    }

    if (!canAccessTicket(ticket, user)) {
        throw new Error("Access denied to this ticket.");
    }

    return await commmentRepository.getCommentsByTicketId(ticketId, ticket.company_code);
};
