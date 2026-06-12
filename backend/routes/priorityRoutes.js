const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getPriorities,
} = require("../controllers/priorityController");

router.get("/", authMiddleware, getPriorities);

module.exports = router;
