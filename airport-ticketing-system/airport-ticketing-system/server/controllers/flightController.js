const Flight = require('../models/Flight');
const Airport = require('../models/Airport');
const Ticket = require('../models/Ticket');
const WaitlistEntry = require('../models/WaitlistEntry');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  ACTIVE_TICKET_STATUSES,
  SEAT_CLASSES,
  SEAT_LETTERS,
  TICKET_STATUS,
  WAITLIST_STATUS,
} = require('../utils/constants');

const AIRPORT_FIELDS = 'code name city country';
const EDITABLE_FIELDS = [
  'flightNumber', 'airline', 'origin', 'destination', 'departureTime', 'arrivalTime',
  'aircraft', 'gate', 'status', 'rows', 'seatsPerRow', 'businessRows', 'price',
];
const SORTS = {
  departure: { departureTime: 1 },
  price: { 'price.economy': 1, departureTime: 1 },
  latest: { departureTime: -1 },
};
const MAX_PAGE_SIZE = 50;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function airportIdByCode(code) {
  const airport = await Airport.findOne({ code: String(code).toUpperCase() }).select('_id');
  return airport?._id ?? null;
}

function parseDate(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw ApiError.badRequest(`Invalid ${label}`);
  return date;
}

// GET /api/flights?origin=NBO&destination=MBA&departAfter=ISO&departBefore=ISO&seatClass=economy&q=KQ&sort=price&page=1&limit=12
const searchFlights = asyncHandler(async (req, res) => {
  const { origin, destination, departAfter, departBefore, seatClass, q, status } = req.query;
  const filter = {};

  if (origin) filter.origin = await airportIdByCode(origin);
  if (destination) filter.destination = await airportIdByCode(destination);
  if ((origin && !filter.origin) || (destination && !filter.destination)) {
    return res.json({ flights: [], total: 0, page: 1, pages: 0 });
  }

  // Passengers only see future flights unless they explicitly ask for a window.
  filter.departureTime = { $gte: departAfter ? parseDate(departAfter, 'departAfter') : new Date() };
  if (departBefore) filter.departureTime.$lt = parseDate(departBefore, 'departBefore');

  filter.status = status ? String(status) : { $ne: 'cancelled' };

  if (seatClass && SEAT_CLASSES.includes(seatClass)) {
    filter.$expr = { $lt: [`$booked.${seatClass}`, `$capacity.${seatClass}`] };
  }

  if (q) {
    const pattern = new RegExp(escapeRegex(String(q).trim()), 'i');
    filter.$or = [{ flightNumber: pattern }, { airline: pattern }];
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), MAX_PAGE_SIZE);
  const sort = SORTS[req.query.sort] || SORTS.departure;

  const [flights, total] = await Promise.all([
    Flight.find(filter)
      .populate('origin', AIRPORT_FIELDS)
      .populate('destination', AIRPORT_FIELDS)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Flight.countDocuments(filter),
  ]);

  return res.json({ flights, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/flights/:id
const getFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.findById(req.params.id)
    .populate('origin', AIRPORT_FIELDS)
    .populate('destination', AIRPORT_FIELDS);
  if (!flight) throw ApiError.notFound('Flight not found');

  const waitlist = await WaitlistEntry.aggregate([
    { $match: { flight: flight._id, status: WAITLIST_STATUS.WAITING } },
    { $group: { _id: '$seatClass', count: { $sum: 1 } } },
  ]);
  const waitlistCounts = Object.fromEntries(SEAT_CLASSES.map((c) => [c, 0]));
  waitlist.forEach(({ _id, count }) => { waitlistCounts[_id] = count; });

  res.json({ ...flight.toJSON(), waitlistCounts });
});

// GET /api/flights/:id/seats - layout plus occupied seats (no passenger data)
const getSeatMap = asyncHandler(async (req, res) => {
  const flight = await Flight.findById(req.params.id).select('rows seatsPerRow businessRows');
  if (!flight) throw ApiError.notFound('Flight not found');

  const occupied = await Ticket.distinct('seat', {
    flight: flight._id,
    status: { $in: ACTIVE_TICKET_STATUSES },
    seat: { $type: 'string' },
  });

  res.json({
    rows: flight.rows,
    seatsPerRow: flight.seatsPerRow,
    businessRows: flight.businessRows,
    letters: SEAT_LETTERS.slice(0, flight.seatsPerRow),
    occupied,
  });
});

const pickEditable = (body) => Object.fromEntries(
  EDITABLE_FIELDS.filter((key) => body[key] !== undefined).map((key) => [key, body[key]])
);

// POST /api/flights (admin)
const createFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.create(pickEditable(req.body));
  await flight.populate(['origin', 'destination']);
  res.status(201).json(flight);
});

/** Cancels every active ticket and waitlist entry when a flight is cancelled. */
async function cascadeFlightCancellation(flight) {
  await Ticket.updateMany(
    { flight: flight._id, status: { $in: ACTIVE_TICKET_STATUSES } },
    {
      $set: { status: TICKET_STATUS.CANCELLED, active: false, adminNote: 'Flight cancelled by airline' },
      $unset: { seat: '' },
    }
  );
  await WaitlistEntry.updateMany(
    { flight: flight._id, status: WAITLIST_STATUS.WAITING },
    { status: WAITLIST_STATUS.LEFT }
  );
  flight.booked = { economy: 0, business: 0 };
  await flight.save();
}

// PUT /api/flights/:id (admin)
const updateFlight = asyncHandler(async (req, res) => {
  const flight = await Flight.findById(req.params.id);
  if (!flight) throw ApiError.notFound('Flight not found');

  const wasCancelled = flight.status === 'cancelled';
  flight.set(pickEditable(req.body));
  await flight.validate();

  // Layout changes must still fit everyone already holding a seat.
  const overbooked = SEAT_CLASSES.filter((c) => flight.capacity[c] < flight.booked[c]);
  if (overbooked.length) {
    throw ApiError.conflict(`New layout is smaller than seats already sold (${overbooked.join(', ')})`);
  }

  await flight.save();
  if (!wasCancelled && flight.status === 'cancelled') await cascadeFlightCancellation(flight);

  await flight.populate(['origin', 'destination']);
  res.json(flight);
});

// DELETE /api/flights/:id (admin)
const deleteFlight = asyncHandler(async (req, res) => {
  const hasTickets = await Ticket.exists({ flight: req.params.id });
  if (hasTickets) {
    throw ApiError.conflict('Flight has ticket history; set its status to cancelled instead');
  }
  const flight = await Flight.findByIdAndDelete(req.params.id);
  if (!flight) throw ApiError.notFound('Flight not found');
  await WaitlistEntry.deleteMany({ flight: flight._id });
  res.json({ message: 'Flight deleted' });
});

module.exports = { searchFlights, getFlight, getSeatMap, createFlight, updateFlight, deleteFlight };
