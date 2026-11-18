const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register, login, getMe, getSavedFlights, saveFlight, unsaveFlight,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { requireFields, validateObjectId } = require('../middleware/validate');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/register', authLimiter, requireFields('name', 'email', 'password'), register);
router.post('/login', authLimiter, requireFields('email', 'password'), login);

router.get('/me', protect, getMe);
router.get('/me/saved', protect, getSavedFlights);
router.post('/me/saved/:flightId', protect, validateObjectId('flightId'), saveFlight);
router.delete('/me/saved/:flightId', protect, validateObjectId('flightId'), unsaveFlight);

module.exports = router;
