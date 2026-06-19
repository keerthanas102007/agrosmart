const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const uploadProfile = require("../middleware/uploadProfile");

const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    deleteAccount,
    setLang,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, uploadProfile.single("profile_pic"), updateProfile);
router.delete("/delete-account", verifyToken, deleteAccount);
router.post("/set-lang", verifyToken, setLang);

module.exports = router;
