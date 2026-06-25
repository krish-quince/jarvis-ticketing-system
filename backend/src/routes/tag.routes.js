import { Router } from "express";

import {
  getTags,
  getTicketTags,
  updateTicketTags,
  getCompanyFreeformTags,
  getFreeformTicketTags,
  addFreeformTicketTag,
  deleteFreeformTicketTag,
} from "../controllers/tag.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";

import { validate } from "../middleware/validation.middleware.js";

import { updateTicketTagsSchema } from "../validators/tag.validator.js";

const router = Router();

// ── Legacy admin-catalog tags (kept for backward compat) ──────────────────────
router.get("/tags", verifyToken, getTags);
router.get("/:ticketId/tags", verifyToken, getTicketTags);
router.put("/:ticketId/tags", verifyToken, validate(updateTicketTagsSchema), updateTicketTags);

// ── Freeform tags ─────────────────────────────────────────────────────────────
// Static segment must come BEFORE /:ticketId to avoid route conflicts.
router.get("/freeform-tags", verifyToken, getCompanyFreeformTags);
router.get("/:ticketId/freeform-tags", verifyToken, getFreeformTicketTags);
router.post("/:ticketId/freeform-tags", verifyToken, addFreeformTicketTag);
router.delete("/:ticketId/freeform-tags/:tagId", verifyToken, deleteFreeformTicketTag);

export default router;
