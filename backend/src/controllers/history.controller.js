import * as historyService from "../services/history.service.js";

export const getTicketHistory = async(req, res) => {
    try {
        const { ticketId } = req.params;

        const history = await historyService.getTicketHistory(ticketId, req.user.companyId);

        return res.status(200).json({
            success: true,
            data: history,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
