const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadPost");

const {
    createPost,
    getAllPosts,
    likePost,
    addComment,
    getComments,
    addProfitHistory,
    getMyProfitHistory,
    deletePost,
    getMyPosts
} = require("../controllers/postController");

// Community Posts
router.get("/all", getAllPosts);                         // public (shows like counts; auth optional for user_liked)
router.post("/create", verifyToken, upload.single("image"), createPost);
router.post("/like", verifyToken, likePost);            // toggle like
router.post("/comment", verifyToken, addComment);
router.get("/comments/:postId", getComments);
router.delete("/:postId", verifyToken, deletePost);
router.get("/my-posts", verifyToken, getMyPosts);       // logged-in user's own posts

// Profit History
router.post("/profit", verifyToken, upload.single("image"), addProfitHistory);
router.get("/my-profit", verifyToken, getMyProfitHistory);

module.exports = router;
