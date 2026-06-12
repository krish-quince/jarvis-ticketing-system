const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { getStatuses } = require("../controllers/statusController");

router.get("/", authMiddleware, getStatuses);

module.exports = router;
