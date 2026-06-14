import { Router } from "express";

import {
    createComment,
    getCommentsByTicketId
} from "../controllers/comment.controller.js";

import {
    verifyToken
} from "../middleware/auth.middleware.js";

import {
    validate
}
from "../middleware/validation.middleware.js";

import {
    createCommentSchema
}
from "../validators/comment.validator.js";

const router = Router();

router.post(
    "/:ticketId/comments",
    verifyToken,
    validate(createCommentSchema),
    createComment
);

router.get("/:ticketId/comments", verifyToken, getCommentsByTicketId);

export default router;