const express    = require("express");
const router     = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const {
    getFarmHistory,
    addFarmHistory,
    deleteFarmHistory,
    clearFarmHistory,
} = require("../controllers/farmHistoryController");

// GET  /api/farm-history          → get all entries for logged-in farmer
router.get("/",           verifyToken, getFarmHistory);

// POST /api/farm-history          → add new activity entry
router.post("/",          verifyToken, addFarmHistory);

// DELETE /api/farm-history/:id    → delete one entry
router.delete("/:id",     verifyToken, deleteFarmHistory);

// DELETE /api/farm-history/clear  → clear all entries
router.delete("/clear/all", verifyToken, clearFarmHistory);

module.exports = router;
