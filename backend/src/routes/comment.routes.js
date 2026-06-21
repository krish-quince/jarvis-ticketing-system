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
import { uploadCommentAttachments } from "../middleware/commentUpload.middleware.js";

const router = Router();

router.post(
    "/:ticketId/comments",
    verifyToken,
    uploadCommentAttachments.array("attachments", 10),
    validate(createCommentSchema),
    createComment
);

router.get("/:ticketId/comments", verifyToken, getCommentsByTicketId);

export default router;
