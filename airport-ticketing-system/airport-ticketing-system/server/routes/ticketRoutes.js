const express = require('express');
const {
  createTicket, getMyTickets, getAllTickets, getTicket,
  selectSeat, checkIn, cancelTicket, reviewTicket,
} = require('../controllers/ticketController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { requireFields, validateObjectId } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  requireFields('flightId', 'seatClass', 'passenger.firstName', 'passenger.lastName'),
  createTicket
);
router.get('/mine', getMyTickets);
router.get('/', isAdmin, getAllTickets);
router.get('/:id', validateObjectId(), getTicket);
router.patch('/:id/seat', validateObjectId(), requireFields('seat'), selectSeat);
router.patch('/:id/check-in', validateObjectId(), checkIn);
router.patch('/:id/cancel', validateObjectId(), cancelTicket);
router.patch('/:id/status', isAdmin, validateObjectId(), requireFields('status'), reviewTicket);

module.exports = router;
