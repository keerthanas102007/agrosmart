const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const uploadDisease = require("../middleware/uploadDisease");

const {
    analyzeDisease,
    analyzeFarmPhoto,
    getDiseaseHistory,
    getFarmPhotoHistory,
    deleteDiseaseHistory
} = require("../controllers/diseaseController");

router.post("/analyze", verifyToken, uploadDisease.single("image"), analyzeDisease);
router.post("/farm-analyze", verifyToken, uploadDisease.single("image"), analyzeFarmPhoto);
router.get("/history", verifyToken, getDiseaseHistory);
router.get("/farm-history", verifyToken, getFarmPhotoHistory);
router.delete("/history/:id", verifyToken, deleteDiseaseHistory);

module.exports = router;
