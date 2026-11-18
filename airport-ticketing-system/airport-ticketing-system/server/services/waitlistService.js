const Ticket = require('../models/Ticket');
const WaitlistEntry = require('../models/WaitlistEntry');
const { reserveSeat, releaseSeat } = require('./seatInventory');
const { WAITLIST_STATUS } = require('../utils/constants');

/**
 * Moves the longest-waiting passenger for a flight/class into a pending ticket,
 * as long as a seat can be held. Returns the new ticket or null.
 */
async function promoteNext(flightId, seatClass) {
  const entry = await WaitlistEntry.findOneAndUpdate(
    { flight: flightId, seatClass, status: WAITLIST_STATUS.WAITING },
    { status: WAITLIST_STATUS.PROMOTED },
    { sort: { createdAt: 1 }, new: true }
  );
  if (!entry) return null;

  const flight = await reserveSeat(flightId, seatClass);
  if (!flight) {
    // Seat was taken in the meantime: put the passenger back in the queue.
    await WaitlistEntry.updateOne({ _id: entry._id }, { status: WAITLIST_STATUS.WAITING });
    return null;
  }

  try {
    const ticket = await Ticket.create({
      user: entry.user,
      flight: flightId,
      passenger: entry.passenger,
      seatClass,
      price: flight.price[seatClass],
      fromWaitlist: true,
    });
    entry.ticket = ticket._id;
    await entry.save();
    return ticket;
  } catch (err) {
    await releaseSeat(flightId, seatClass);
    await WaitlistEntry.updateOne({ _id: entry._id }, { status: WAITLIST_STATUS.WAITING });
    throw err;
  }
}

/** Position (1-based) of a waiting entry in its queue. */
async function queuePosition(entry) {
  const ahead = await WaitlistEntry.countDocuments({
    flight: entry.flight._id || entry.flight,
    seatClass: entry.seatClass,
    status: WAITLIST_STATUS.WAITING,
    createdAt: { $lt: entry.createdAt },
  });
  return ahead + 1;
}

module.exports = { promoteNext, queuePosition };
