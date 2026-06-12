const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getCategories,
} = require("../controllers/categoryController");

router.get("/", authMiddleware, getCategories);

module.exports = router;
