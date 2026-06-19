const express = require("express");
const router  = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getReports } = require("../controllers/reportsController");

router.get("/", verifyToken, getReports);

module.exports = router;
