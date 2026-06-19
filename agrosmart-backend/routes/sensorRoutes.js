const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    getSensorData,
    getLatestSensors,
    postSensorData,
    addSensor,
    getCropRecommendation,
    autoSimulate,
} = require("../controllers/sensorController");

router.get("/data",               verifyToken, getSensorData);
router.get("/latest",             verifyToken, getLatestSensors);
router.post("/push",              postSensorData);           // IoT device posts here (no auth)
router.post("/add",               verifyToken, addSensor);
router.get("/crop-recommendation",verifyToken, getCropRecommendation);
router.post("/simulate",          verifyToken, autoSimulate); // Software simulation trigger

module.exports = router;
