import { Router } from "express";

import {
    createUser,
    getAllUsers,
    getAllUsersWithData,
    updateUser,
    getUserByCodeDetail,
    searchUsers
} from "../controllers/user.controller.js";

import {
    verifyToken
} from "../middleware/auth.middleware.js";

import {
    requireAdmin,
    requireTechnicianOrAdmin
} from "../middleware/role.middleware.js";

const router = Router();

router.get(
    "/",
    verifyToken,
    getAllUsers
);

router.get(
    "/search",
    verifyToken,
    requireTechnicianOrAdmin,
    searchUsers
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
