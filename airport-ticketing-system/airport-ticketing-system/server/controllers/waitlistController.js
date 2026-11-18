const Flight = require('../models/Flight');
const WaitlistEntry = require('../models/WaitlistEntry');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { queuePosition } = require('../services/waitlistService');
const { SEAT_CLASSES, WAITLIST_STATUS } = require('../utils/constants');

const FLIGHT_POPULATE = {
  path: 'flight',
  populate: [
    { path: 'origin', select: 'code city' },
    { path: 'destination', select: 'code city' },
  ],
};

async function withPositions(entries) {
  return Promise.all(entries.map(async (entry) => ({
    ...entry.toJSON(),
    position: entry.status === WAITLIST_STATUS.WAITING ? await queuePosition(entry) : null,
  })));
}

// POST /api/waitlist { flightId, seatClass, passenger }
const joinWaitlist = asyncHandler(async (req, res) => {
  const { flightId, seatClass, passenger } = req.body;
  if (!SEAT_CLASSES.includes(seatClass)) throw ApiError.badRequest('Invalid seat class');

  const flight = await Flight.findById(flightId);
  if (!flight) throw ApiError.notFound('Flight not found');
  if (flight.status === 'cancelled' || flight.departureTime <= new Date()) {
    throw ApiError.badRequest('This flight is no longer accepting waitlist requests');
  }
  if (flight.seatsAvailable[seatClass] > 0) {
    throw ApiError.badRequest(`Seats are still available in ${seatClass}; book directly instead`);
  }

  try {
    const entry = await WaitlistEntry.create({
      user: req.user._id,
      flight: flight._id,
      seatClass,
      passenger: {
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        email: passenger.email || req.user.email,
      },
    });
    await entry.populate(FLIGHT_POPULATE);
    const [result] = await withPositions([entry]);
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('You are already on the waitlist for this flight');
    throw err;
  }
});

// GET /api/waitlist/mine
const getMyWaitlist = asyncHandler(async (req, res) => {
  const entries = await WaitlistEntry.find({ user: req.user._id })
    .populate(FLIGHT_POPULATE)
    .sort({ createdAt: -1 });
  res.json(await withPositions(entries));
});

// GET /api/waitlist (admin) ?status=waiting
const getAllWaitlist = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: String(req.query.status) } : {};
  const entries = await WaitlistEntry.find(filter)
    .populate(FLIGHT_POPULATE)
    .populate('user', 'name email')
    .sort({ createdAt: 1 })
    .limit(200);
  res.json(await withPositions(entries));
});

// DELETE /api/waitlist/:id
const leaveWaitlist = asyncHandler(async (req, res) => {
  const entry = await WaitlistEntry.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: WAITLIST_STATUS.WAITING },
    { status: WAITLIST_STATUS.LEFT },
    { new: true }
  );
  if (!entry) throw ApiError.notFound('Active waitlist entry not found');
  res.json(entry);
});

module.exports = { joinWaitlist, getMyWaitlist, getAllWaitlist, leaveWaitlist };
