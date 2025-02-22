const multer = require("multer");
const path = require("path");

// Set up storage engine for post images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/postsImages/"); // Save files in the 'uploads/postsImages' folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Append a unique suffix to the filename
  },
});

// Initialize Multer for post images
const upload = multer({ storage: storage });

module.exports = upload;
