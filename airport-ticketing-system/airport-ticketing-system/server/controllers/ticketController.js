const Ticket = require('../models/Ticket');
const Flight = require('../models/Flight');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { bookTicket, closeTicket } = require('../services/ticketService');
const {
  ROLES,
  SEAT_CLASSES,
  TICKET_STATUS,
  CHECK_IN_WINDOW_HOURS,
} = require('../utils/constants');

const FLIGHT_POPULATE = {
  path: 'flight',
  populate: [
    { path: 'origin', select: 'code name city' },
    { path: 'destination', select: 'code name city' },
  ],
};
const MAX_PAGE_SIZE = 100;

const isOwnerOrAdmin = (ticket, user) =>
  user.role === ROLES.ADMIN || String(ticket.user._id || ticket.user) === String(user._id);

async function loadTicket(id, user, { populate = true } = {}) {
  const query = Ticket.findById(id);
  if (populate) query.populate(FLIGHT_POPULATE);
  const ticket = await query;
  if (!ticket || !isOwnerOrAdmin(ticket, user)) throw ApiError.notFound('Ticket not found');
  return ticket;
}

function assertFlightOpen(flight) {
  if (['cancelled', 'departed'].includes(flight.status) || flight.departureTime <= new Date()) {
    throw ApiError.badRequest('This flight is no longer open for changes');
  }
}

// POST /api/tickets
const createTicket = asyncHandler(async (req, res) => {
  const { flightId, seatClass, passenger } = req.body;
  if (!SEAT_CLASSES.includes(seatClass)) throw ApiError.badRequest('Invalid seat class');

  const flight = await Flight.findById(flightId);
  if (!flight) throw ApiError.notFound('Flight not found');
  assertFlightOpen(flight);

  const ticket = await bookTicket({
    userId: req.user._id,
    flightId: flight._id,
    seatClass,
    passenger: {
      firstName: passenger.firstName,
      lastName: passenger.lastName,
      email: passenger.email || req.user.email,
    },
  });

  await ticket.populate(FLIGHT_POPULATE);
  res.status(201).json(ticket);
});

// GET /api/tickets/mine
const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ user: req.user._id })
    .populate(FLIGHT_POPULATE)
    .sort({ createdAt: -1 });
  res.json(tickets);
});

// GET /api/tickets (admin) ?status=pending&q=PNR&page=1&limit=20
const getAllTickets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.q) filter.bookingRef = String(req.query.q).trim().toUpperCase();

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), MAX_PAGE_SIZE);

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate(FLIGHT_POPULATE)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Ticket.countDocuments(filter),
  ]);
  res.json({ tickets, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/tickets/:id
const getTicket = asyncHandler(async (req, res) => {
  res.json(await loadTicket(req.params.id, req.user));
});

// PATCH /api/tickets/:id/seat { seat: "12A" }
const selectSeat = asyncHandler(async (req, res) => {
  const ticket = await loadTicket(req.params.id, req.user);
  const seat = String(req.body.seat || '').toUpperCase();

  if (![TICKET_STATUS.PENDING, TICKET_STATUS.CONFIRMED].includes(ticket.status)) {
    throw ApiError.badRequest(`Seats cannot be changed on a ${ticket.status} ticket`);
  }
  assertFlightOpen(ticket.flight);

  const seatClass = ticket.flight.classForSeat(seat);
  if (!seatClass) throw ApiError.badRequest(`Seat ${seat} does not exist on this aircraft`);
  if (seatClass !== ticket.seatClass) {
    throw ApiError.badRequest(`Seat ${seat} is ${seatClass} class; your ticket is ${ticket.seatClass}`);
  }

  ticket.seat = seat;
  try {
    await ticket.save();
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict(`Seat ${seat} was just taken, please pick another`);
    throw err;
  }
  res.json(ticket);
});

// PATCH /api/tickets/:id/check-in
const checkIn = asyncHandler(async (req, res) => {
  const ticket = await loadTicket(req.params.id, req.user);

  if (ticket.status !== TICKET_STATUS.CONFIRMED) {
    throw ApiError.badRequest('Only confirmed tickets can be checked in');
  }
  if (!ticket.seat) throw ApiError.badRequest('Select a seat before checking in');
  assertFlightOpen(ticket.flight);

  const opensAt = new Date(ticket.flight.departureTime.getTime() - CHECK_IN_WINDOW_HOURS * 3600 * 1000);
  if (new Date() < opensAt) {
    throw ApiError.badRequest(`Online check-in opens ${CHECK_IN_WINDOW_HOURS} hours before departure`);
  }

  ticket.status = TICKET_STATUS.CHECKED_IN;
  ticket.checkedInAt = new Date();
  await ticket.save();
  res.json(ticket);
});

// PATCH /api/tickets/:id/cancel
const cancelTicket = asyncHandler(async (req, res) => {
  const ticket = await loadTicket(req.params.id, req.user, { populate: false });
  if (ticket.status === TICKET_STATUS.CHECKED_IN && req.user.role !== ROLES.ADMIN) {
    throw ApiError.badRequest('Checked-in tickets must be cancelled at the airline desk');
  }
  await closeTicket(ticket, TICKET_STATUS.CANCELLED);
  await ticket.populate(FLIGHT_POPULATE);
  res.json(ticket);
});

// PATCH /api/tickets/:id/status (admin) { status: "confirmed" | "rejected", note }
const reviewTicket = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const ticket = await loadTicket(req.params.id, req.user, { populate: false });

  if (ticket.status !== TICKET_STATUS.PENDING) {
    throw ApiError.badRequest(`Only pending tickets can be reviewed (this one is ${ticket.status})`);
  }

  if (status === TICKET_STATUS.CONFIRMED) {
    ticket.status = TICKET_STATUS.CONFIRMED;
    if (note) ticket.adminNote = note;
    await ticket.save();
  } else if (status === TICKET_STATUS.REJECTED) {
    await closeTicket(ticket, TICKET_STATUS.REJECTED, note);
  } else {
    throw ApiError.badRequest('Status must be confirmed or rejected');
  }

  await ticket.populate([FLIGHT_POPULATE, { path: 'user', select: 'name email' }]);
  res.json(ticket);
});

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicket,
  selectSeat,
  checkIn,
  cancelTicket,
  reviewTicket,
};
