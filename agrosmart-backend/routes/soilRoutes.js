const express    = require("express");
const router     = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const uploadSoil  = require("../middleware/uploadSoil");
const { analyzeSoil, getSoilHistory } = require("../controllers/soilController");

router.post("/analyze",  verifyToken, uploadSoil.single("image"), analyzeSoil);
router.get("/history",   verifyToken, getSoilHistory);

module.exports = router;
