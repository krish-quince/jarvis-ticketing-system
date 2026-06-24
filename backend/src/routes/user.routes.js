import { Router } from "express";

import {
    createUser,
    getAllUsers,
    getAllUsersWithData,
    updateUser,
    getUserByCodeDetail
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

router.get(
    "/getAllUsersWithData",
    verifyToken,
    requireAdmin,
    getAllUsersWithData
);

router.get(
    "/:userCode",
    verifyToken,
    getUserByCodeDetail
);

router.post(
  "/",
  verifyToken,
  requireAdmin,
  createUser
);

router.patch(
  "/:userCode",
  verifyToken,
  requireAdmin,
  updateUser
);

export default router;
