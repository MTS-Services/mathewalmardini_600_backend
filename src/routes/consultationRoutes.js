const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');

// Book consultation route - Step 1: User submits form
router.post('/book-consultation', consultationController.bookConsultation);

// Confirm consultation route - Step 2: User clicks link
router.get('/confirm/:token', consultationController.confirmConsultation);

module.exports = router;
