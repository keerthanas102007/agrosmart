const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const dir = "uploads/soils";
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename:    (req, file, cb) => cb(null, Date.now() + "-soil-" + file.originalname.replace(/\s/g, "_")),
});

const fileFilter = (req, file, cb) => {
    const ok = [".jpg",".jpeg",".png",".webp"].includes(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error("Only image files allowed"), false);
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
