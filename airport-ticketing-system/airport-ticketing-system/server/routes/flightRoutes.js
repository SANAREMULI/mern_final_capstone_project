const express = require('express');
const {
  searchFlights, getFlight, getSeatMap, createFlight, updateFlight, deleteFlight,
} = require('../controllers/flightController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { requireFields, validateObjectId } = require('../middleware/validate');

const router = express.Router();

router.get('/', searchFlights);
router.get('/:id', validateObjectId(), getFlight);
router.get('/:id/seats', validateObjectId(), getSeatMap);

router.post(
  '/',
  protect,
  isAdmin,
  requireFields(
    'flightNumber', 'airline', 'origin', 'destination', 'departureTime', 'arrivalTime',
    'rows', 'seatsPerRow', 'price.economy', 'price.business'
  ),
  createFlight
);
router.put('/:id', protect, isAdmin, validateObjectId(), updateFlight);
router.delete('/:id', protect, isAdmin, validateObjectId(), deleteFlight);

module.exports = router;
