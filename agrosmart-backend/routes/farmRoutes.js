const express = require("express");
const router  = express.Router();
const verify  = require("../middleware/authMiddleware");
const {
    getFarmDetails, saveFarmDetails,
    getFields, saveField, deleteField,
    getCalendar, saveCalendarItem, deleteCalendarItem,
} = require("../controllers/farmController");
const { getFertilizerData } = require("../controllers/fertilizerController");

// Farm Details
router.get("/details",          verify, getFarmDetails);
router.post("/details",         verify, saveFarmDetails);

// Fields
router.get("/fields",           verify, getFields);
router.post("/fields",          verify, saveField);
router.delete("/fields/:id",    verify, deleteField);

// Crop Calendar
router.get("/calendar",         verify, getCalendar);
router.post("/calendar",        verify, saveCalendarItem);
router.delete("/calendar/:id",  verify, deleteCalendarItem);

// Fertilizer smart data (aggregated)
router.get("/fertilizer-data",  verify, getFertilizerData);

module.exports = router;
