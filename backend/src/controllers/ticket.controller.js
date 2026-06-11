import * as ticketService from "../services/ticket.service.js";

export const createTicket = async (req, res) => {
    try {
        const ticket = await ticketService.createTicket(req.body, req.user);

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

export const getAllTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getAllTickets(req.user.companyId);

        return res.status(200).json({
            success: true,
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

        const ticket = await ticketService.getTicketById(ticketId, req.user.companyId);

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