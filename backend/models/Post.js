const mongoose = require("mongoose");

// Idea 1: Farmer community posts with photos + instructions
const commentSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text:    { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  author:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  photos:      [{ type: String }],          // Cloudinary URLs
  steps:       [{ type: String }],          // Step-by-step instructions
  cropType:    { type: String, default: "" },
  profit:      { type: Number, default: 0 }, // Amount earned (₹)
  season:      { type: String, default: "" },
  likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments:    [commentSchema],
  views:       { type: Number, default: 0 },
  tags:        [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
