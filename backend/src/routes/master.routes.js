import express from "express";

import {
  getCategories,
  getPriorities,
} from "../controllers/master.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/categories",
  verifyToken,
  getCategories
);

router.get(
  "/priorities",
  verifyToken,
  getPriorities
);

export default router;