import * as commentService from "../services/comment.service.js";

export const createComment = async(req, res) => {
    try {
        const { ticketId } = req.params;
        const { comment_text } = req.body;

        const comment = await commentService.createComment(ticketId, comment_text, req.user);

        return res.status(201).json({
            success: true,
            data: comment,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getCommentsByTicketId = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const comments = await commentService.getCommentsByTicketId(ticketId);

        return res.status(200).json({
            success: true,
            data: comments,
        });

    } catch (error) {
        console.error(error);

        if(error.message === "Ticket not found") {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};