const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    getMotorStatus,
    toggleMotor,
    setLandLocation,
    getWeatherForLand,
    autoMotorDecision,
    getIrrigationLogs,
    getWaterUsage
} = require("../controllers/irrigationController");

router.get("/motor", verifyToken, getMotorStatus);
router.post("/motor/toggle", verifyToken, toggleMotor);
router.post("/location", verifyToken, setLandLocation);
router.get("/weather", verifyToken, getWeatherForLand);
router.post("/auto-decision", verifyToken, autoMotorDecision);
router.get("/logs", verifyToken, getIrrigationLogs);
router.get("/water-usage", verifyToken, getWaterUsage);

module.exports = router;
