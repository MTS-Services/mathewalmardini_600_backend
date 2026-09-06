const multer = require("multer");
const { uploadImageBuffer, ALLOWED_MIME } = require("../services/s3Service");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, WebP, or HEIC images are allowed"));
      return;
    }
    cb(null, true);
  },
});

class UploadController {
  middleware() {
    return upload.single("file");
  }

  async uploadImage(req, res) {
    console.log("\n===== Image upload request =====");
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided",
        });
      }

      console.log(
        "Uploading:",
        req.file.originalname,
        req.file.mimetype,
        `${Math.round(req.file.size / 1024)}KB`,
      );

      const result = await uploadImageBuffer({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        folder: "form_images",
      });

      console.log("Uploaded to S3:", result.url);

      return res.status(200).json({
        success: true,
        url: result.url,
        key: result.key,
      });
    } catch (error) {
      console.error("Upload error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to upload image",
      });
    }
  }
}

module.exports = new UploadController();
