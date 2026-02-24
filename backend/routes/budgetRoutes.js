const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getBudgets, createBudget, deleteBudget } = require('../controllers/budgetController');

router.get('/', protect, getBudgets);
router.post('/', protect, createBudget);
router.delete('/:id', protect, deleteBudget);

module.exports = router;
