const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getGoals, createGoal, updateGoal, deleteGoal } = require('../controllers/goalController');

router.get('/', protect, getGoals);
router.post('/', protect, createGoal);
router.put('/:id', protect, updateGoal);
router.delete('/:id', protect, deleteGoal);

module.exports = router;
