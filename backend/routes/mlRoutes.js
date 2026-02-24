const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { categorizeTransactions, getForecast, getAnomalies, getInsights } = require('../controllers/mlController');

router.post('/categorize', protect, categorizeTransactions);
router.get('/forecast', protect, getForecast);
router.get('/anomalies', protect, getAnomalies);
router.get('/insights', protect, getInsights);

module.exports = router;
