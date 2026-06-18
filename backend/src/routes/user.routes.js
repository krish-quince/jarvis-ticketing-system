import { Router } from "express";

import {
    getAllUsers
} from "../controllers/user.controller.js";

import {
    verifyToken
} from "../middleware/auth.middleware.js";

import {
    requireAdmin
} from "../middleware/role.middleware.js";

const router = Router();

router.get(
    "/",
    verifyToken,
    getAllUsers
);

export default router;