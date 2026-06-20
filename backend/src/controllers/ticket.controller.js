import * as ticketService from "../services/ticket.service.js";

const sendTicketError = (res, error) => {
    if(
        error.message === "Ticket not found." ||
        error.message === "Assigned user not found." ||
        error.message === "Status not found." ||
        error.message === "Resolved status not found." ||
        error.message === "Priority not found." ||
        error.message === "Category not found." ||
        error.message === "Subcategory not found." ||
        error.message === "Subcategory does not belong to selected category." ||
        error.message === "Assigned user must belong to the ticket category or department."
    ) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }

    if(error.message.endsWith("is required.")) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }

    return res.status(500).json({
        success: false,
        message: error.message,
    });
};

export const createTicket = async (req, res) => {
    try {
        const ticket = await ticketService.createTicket(req.body, req.user, req.files || []);

        return res.status(201).json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllTickets = async (
    req,
    res
) => {

    try {

        const {
            search = "",
            page = 1,
            limit = 25
        } = req.query;

        const tickets =
            await ticketService.getAllTickets(
                req.user.companyCode,
                req.user,
                search,
                Number(page),
                Number(limit)
            );

        return res.status(200).json({
            success: true,
            page: Number(page),
            limit: Number(limit),
            count: tickets.length,
            data: tickets,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await ticketService.getTicketById(ticketId, req.user.companyCode, req.user);

        if(!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket Not Found.."
            });
        }

        return res.status(200).json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateTicketStatus = async(req, res) => {
    try {
        const { ticketId } = req.params;
        const { status_id } = req.body;

        const ticket = await ticketService.updateTicketStatus(
            ticketId, 
            status_id, 
            req.user
        );

        return res.status(200).json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        console.error(error);

        return sendTicketError(res, error);
    }
};

export const assignTicket = async(req, res) => {
    try {
        const { ticketId } = req.params;
        const { assigned_to_user_code } = req.body;

        const ticket = await ticketService.assignTicket(
            ticketId,
            assigned_to_user_code,
            req.user
        );

        return res.status(200).json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        console.error(error);

        return sendTicketError(res, error);
    }
};

export const updateTicketPriority = async(req, res) => {
    try {
        const { ticketId } = req.params;
        const { priority_id } = req.body;

        const ticket = await ticketService.updateTicketPriority(
            ticketId,
            priority_id,
            req.user
        );

        return res.status(200).json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        console.error(error);

        return sendTicketError(res, error);
    }
};

export const updateTicketCategory = async(req, res) => {
    try {
        const { ticketId } = req.params;
        const { category_id, subcategory_id } = req.body;

        const ticket = await ticketService.updateTicketCategory(
            ticketId,
            category_id,
            subcategory_id,
            req.user
        );

        return res.status(200).json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        console.error(error);

        return sendTicketError(res, error);
    }
};

export const resolveTicket = async(req, res) => {
    try {
        const { ticketId } = req.params;
        const { status_id } = req.body;

        const ticket = await ticketService.resolveTicket(
            ticketId,
            status_id,
            req.user
        );

        return res.status(200).json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        console.error(error);

        return sendTicketError(res, error);
    }
};

export const takeoverTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await ticketService.takeoverTicket(
            ticketId,
            req.user
        );

        return res.status(200).json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        console.error(error);

        return sendTicketError(res, error);
    }
};

export const updateTicketDueDate = async (req, res) => {
    try {

        const { ticketId } = req.params;
        const { due_date } = req.body;

        const ticket =
            await ticketService.updateTicketDueDate(
                ticketId,
                due_date,
                req.user
            );

        return res.status(200).json({
            success: true,
            data: ticket,
        });

    } catch (error) {

        console.error(error);

        return sendTicketError(res, error);
    }
};
