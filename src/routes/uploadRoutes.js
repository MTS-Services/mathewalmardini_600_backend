const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");

router.post(
  "/upload",
  uploadController.middleware(),
  (err, _req, res, next) => {
    if (err) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 400 : 400;
      return res.status(status).json({
        success: false,
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Image must be 8MB or smaller"
            : err.message || "Upload failed",
      });
    }
    next();
  },
  uploadController.uploadImage.bind(uploadController),
);

module.exports = router;
