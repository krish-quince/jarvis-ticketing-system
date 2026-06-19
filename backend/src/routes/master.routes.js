import express from "express";

import {
  createCategory,
  createPriority,
  createStatus,
  createSubCategory,
  deleteCategory,
  deletePriority,
  deleteStatus,
  deleteSubCategory,
  getCategories,
  getPriorities,
  getSubCategories,
  getAssignableUsers,
  getCompanies,
  getDepartments,
  getRoles,
  getStatuses,
  updateCategory,
  updatePriority,
  updateStatus,
  updateSubCategory,
} from "../controllers/master.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const router = express.Router();
const adminOnly = [verifyToken, requireAdmin];

router.get("/categories", verifyToken, getCategories);
router.get("/priorities", verifyToken, getPriorities);
router.get("/statuses", verifyToken, getStatuses);
router.get("/subcategories/:categoryId", verifyToken, getSubCategories);
router.get("/assignable-users", verifyToken, getAssignableUsers);
router.get(
  "/assignable-users/:subcategoryId",
  verifyToken,
  getAssignableUsers,
);

router.post("/categories", ...adminOnly, createCategory);
router.patch("/categories/:categoryId", ...adminOnly, updateCategory);
router.delete("/categories/:categoryId", ...adminOnly, deleteCategory);

router.post("/subcategories", ...adminOnly, createSubCategory);
router.patch("/subcategories/:subcategoryId", ...adminOnly, updateSubCategory);
router.delete("/subcategories/:subcategoryId", ...adminOnly, deleteSubCategory);

router.post("/statuses", ...adminOnly, createStatus);
router.patch("/statuses/:statusId", ...adminOnly, updateStatus);
router.delete("/statuses/:statusId", ...adminOnly, deleteStatus);

router.post("/priorities", ...adminOnly, createPriority);
router.patch("/priorities/:priorityId", ...adminOnly, updatePriority);
router.delete("/priorities/:priorityId", ...adminOnly, deletePriority);

router.get("/roles", ...adminOnly, getRoles);
router.get("/departments", ...adminOnly, getDepartments);
router.get("/companies", ...adminOnly, getCompanies);

export default router;
