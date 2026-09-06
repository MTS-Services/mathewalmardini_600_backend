const express = require("express");
const router = express.Router();
const bathroomSelectionController = require("../controllers/bathroomSelectionController");

router.post(
  "/bathroom-selection",
  bathroomSelectionController.submit.bind(bathroomSelectionController),
);

module.exports = router;
