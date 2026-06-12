const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getTags,
} = require("../controllers/tagController");

router.get("/", authMiddleware, getTags);

module.exports = router;
