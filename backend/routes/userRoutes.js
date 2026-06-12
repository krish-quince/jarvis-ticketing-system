const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getAllUsers,
  getUserByCode,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

router.get("/", authMiddleware, getAllUsers);

router.get("/:userCode", authMiddleware, getUserByCode);

router.post("/", authMiddleware, createUser);

router.put("/:userCode", authMiddleware, updateUser);

router.delete("/:userCode", authMiddleware, deleteUser);

module.exports = router;