const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for post photos
const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "agrosmart/posts",
    allowed_formats: ["jpg","jpeg","png","webp"],
    transformation: [{ width: 1024, crop: "limit", quality: "auto" }],
  },
});

// Storage for disease/farm analysis photos
const analysisStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "agrosmart/analysis",
    allowed_formats: ["jpg","jpeg","png","webp"],
    transformation: [{ width: 1024, crop: "limit", quality: "auto" }],
  },
});

const uploadPost     = multer({ storage: postStorage,     limits: { files: 5 } });
const uploadAnalysis = multer({ storage: analysisStorage, limits: { files: 1 } });

module.exports = { uploadPost, uploadAnalysis, cloudinary };
