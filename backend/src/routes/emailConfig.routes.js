import express from "express";
import {
  getEmailConfigs,
  createEmailConfig,
  updateEmailConfig,
  activateEmailConfig,
  deleteEmailConfig,
} from "../controllers/emailConfig.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const router = express.Router();
const adminOnly = [verifyToken, requireAdmin];

router.get("/", ...adminOnly, getEmailConfigs);
router.post("/", ...adminOnly, createEmailConfig);
router.patch("/:id", ...adminOnly, updateEmailConfig);
router.post("/:id/activate", ...adminOnly, activateEmailConfig);
router.delete("/:id", ...adminOnly, deleteEmailConfig);

export default router;
