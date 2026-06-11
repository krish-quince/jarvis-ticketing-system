import { Router } from "express";

import {
    createComment,
    getCommentsByTicketId
} from "../controllers/comment.controller.js";

import {
    verifyToken
} from "../middleware/auth.middleware.js";

const router = Router();

router.post("/:ticketId/comments", verifyToken, createComment);

router.get("/:ticketId/comments", verifyToken, getCommentsByTicketId);

export default router;