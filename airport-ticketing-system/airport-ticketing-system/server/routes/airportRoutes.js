const express = require('express');
const {
  listAirports, createAirport, updateAirport, deleteAirport,
} = require('../controllers/airportController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { requireFields, validateObjectId } = require('../middleware/validate');

const router = express.Router();

router.get('/', listAirports);
router.post('/', protect, isAdmin, requireFields('code', 'name', 'city', 'country'), createAirport);
router.put('/:id', protect, isAdmin, validateObjectId(), updateAirport);
router.delete('/:id', protect, isAdmin, validateObjectId(), deleteAirport);

module.exports = router;
