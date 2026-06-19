import express from "express";

import {
  createCategory,
  createPriority,
  createStatus,
  deleteCategory,
  deletePriority,
  deleteStatus,
  getCategories,
  getPriorities,
  getStatuses,
  getSubCategories,
  getAssignableUsers,
  getCompanies,
  getDepartments,
  getRoles,
  getStatuses,
  updateCategory,
  updatePriority,
  updateStatus
} from "../controllers/master.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

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

router.get(
  "/statuses",
  verifyToken,
  getStatuses
);

router.post(
  "/categories",
  verifyToken,
  requireAdmin,
  createCategory
);

router.patch(
  "/categories/:categoryId",
  verifyToken,
  requireAdmin,
  updateCategory
);

router.delete(
  "/categories/:categoryId",
  verifyToken,
  requireAdmin,
  deleteCategory
);

router.post(
  "/statuses",
  verifyToken,
  requireAdmin,
  createStatus
);

router.patch(
  "/statuses/:statusId",
  verifyToken,
  requireAdmin,
  updateStatus
);

router.delete(
  "/statuses/:statusId",
  verifyToken,
  requireAdmin,
  deleteStatus
);

router.post(
  "/priorities",
  verifyToken,
  requireAdmin,
  createPriority
);

router.patch(
  "/priorities/:priorityId",
  verifyToken,
  requireAdmin,
  updatePriority
);

router.delete(
  "/priorities/:priorityId",
  verifyToken,
  requireAdmin,
  deletePriority
);

router.get(
  "/roles",
  verifyToken,
  requireAdmin,
  getRoles
);

router.get(
  "/departments",
  verifyToken,
  requireAdmin,
  getDepartments
);

router.get(
  "/companies",
  verifyToken,
  requireAdmin,
  getCompanies
);

router.get(
  "/subcategories/:categoryId",
  verifyToken,
  getSubCategories
);

router.get(
  "/assignable-users/:subcategoryId",
  verifyToken,
  getAssignableUsers
);

export default router;
