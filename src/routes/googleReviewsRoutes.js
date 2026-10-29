const express = require("express");
const router = express.Router();
const googleReviewsController = require("../controllers/googleReviewsController");

router.get(
  "/google-reviews",
  googleReviewsController.getReviews.bind(googleReviewsController),
);

module.exports = router;
