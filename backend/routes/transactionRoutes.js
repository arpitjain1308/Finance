const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const { getTransactions, addTransaction, updateTransaction, deleteTransaction, uploadCSV, getDashboardStats } = require('../controllers/transactionController');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/plain', 'text/x-csv'];
    if (allowed.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error(`Only CSV files are allowed. Got: ${file.mimetype}`));
    }
  }
});

router.get('/stats', protect, getDashboardStats);
router.get('/', protect, getTransactions);
router.post('/', protect, addTransaction);
router.put('/:id', protect, updateTransaction);
router.delete('/:id', protect, deleteTransaction);
router.post('/upload-csv', protect, upload.single('file'), uploadCSV);

module.exports = router;
