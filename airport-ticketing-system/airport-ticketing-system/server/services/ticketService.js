const Ticket = require('../models/Ticket');
const ApiError = require('../utils/ApiError');
const { reserveSeat, releaseSeat } = require('./seatInventory');
const { promoteNext } = require('./waitlistService');
const { ACTIVE_TICKET_STATUSES } = require('../utils/constants');

/** Holds a seat in the requested class and issues a pending ticket. */
async function bookTicket({ userId, flightId, seatClass, passenger }) {
  const flight = await reserveSeat(flightId, seatClass);
  if (!flight) {
    throw ApiError.conflict(`No ${seatClass} seats left on this flight`, { canJoinWaitlist: true });
  }

  try {
    return await Ticket.create({
      user: userId,
      flight: flightId,
      passenger,
      seatClass,
      price: flight.price[seatClass],
    });
  } catch (err) {
    await releaseSeat(flightId, seatClass);
    throw err;
  }
}

/**
 * Moves an active ticket to a terminal status (cancelled / rejected),
 * returns its seat to inventory and offers it to the waitlist.
 */
async function closeTicket(ticket, status, adminNote) {
  if (!ACTIVE_TICKET_STATUSES.includes(ticket.status)) {
    throw ApiError.badRequest(`Ticket is already ${ticket.status}`);
  }
  ticket.status = status;
  ticket.seat = undefined;
  if (adminNote) ticket.adminNote = adminNote;
  await ticket.save();

  const flightId = ticket.flight._id || ticket.flight;
  await releaseSeat(flightId, ticket.seatClass);
  await promoteNext(flightId, ticket.seatClass);
  return ticket;
}

module.exports = { bookTicket, closeTicket };
