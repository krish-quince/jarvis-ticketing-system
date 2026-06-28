import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  getColumnPreferences,
  saveColumnPreferences,
} from "../controllers/preference.controller.js";

const router = Router();

router.get("/columns/:pageName", verifyToken, getColumnPreferences);
router.put("/columns/:pageName", verifyToken, saveColumnPreferences);

export default router;
