const express = require('express');
const {
  joinWaitlist, getMyWaitlist, getAllWaitlist, leaveWaitlist,
} = require('../controllers/waitlistController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { requireFields, validateObjectId } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  requireFields('flightId', 'seatClass', 'passenger.firstName', 'passenger.lastName'),
  joinWaitlist
);
router.get('/mine', getMyWaitlist);
router.get('/', isAdmin, getAllWaitlist);
router.delete('/:id', validateObjectId(), leaveWaitlist);

module.exports = router;
