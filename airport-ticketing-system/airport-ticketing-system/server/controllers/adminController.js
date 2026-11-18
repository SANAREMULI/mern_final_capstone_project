const Flight = require('../models/Flight');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const WaitlistEntry = require('../models/WaitlistEntry');
const asyncHandler = require('../utils/asyncHandler');
const { TICKET_STATUS, WAITLIST_STATUS, ROLES } = require('../utils/constants');

const UPCOMING_LIMIT = 8;

// GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();

  const [statusCounts, revenue, upcomingFlights, flightCount, passengerCount, waitlistCount] =
    await Promise.all([
      Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([
        { $match: { status: { $in: [TICKET_STATUS.CONFIRMED, TICKET_STATUS.CHECKED_IN] } } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]),
      Flight.find({ departureTime: { $gte: now }, status: { $ne: 'cancelled' } })
        .populate('origin', 'code')
        .populate('destination', 'code')
        .sort({ departureTime: 1 })
        .limit(UPCOMING_LIMIT),
      Flight.countDocuments({ departureTime: { $gte: now } }),
      User.countDocuments({ role: ROLES.PASSENGER }),
      WaitlistEntry.countDocuments({ status: WAITLIST_STATUS.WAITING }),
    ]);

  const ticketsByStatus = Object.fromEntries(Object.values(TICKET_STATUS).map((s) => [s, 0]));
  statusCounts.forEach(({ _id, count }) => { ticketsByStatus[_id] = count; });

  const loadFactors = upcomingFlights.map((f) => {
    const capacity = f.capacity.economy + f.capacity.business;
    const booked = f.booked.economy + f.booked.business;
    return {
      id: f._id,
      flightNumber: f.flightNumber,
      route: `${f.origin?.code} → ${f.destination?.code}`,
      departureTime: f.departureTime,
      booked,
      capacity,
      loadFactor: capacity ? Math.round((booked / capacity) * 100) : 0,
    };
  });

  res.json({
    ticketsByStatus,
    revenue: revenue[0]?.total ?? 0,
    upcomingFlights: flightCount,
    passengers: passengerCount,
    waitlisted: waitlistCount,
    loadFactors,
  });
});

module.exports = { getStats };
