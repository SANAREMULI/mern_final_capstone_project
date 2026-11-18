const Flight = require('../models/Flight');

/**
 * Atomically holds one seat of the given class. Returns the updated flight,
 * or null when the class is sold out. Using a single conditional update
 * means two simultaneous bookings can never oversell the last seat.
 */
function reserveSeat(flightId, seatClass) {
  return Flight.findOneAndUpdate(
    {
      _id: flightId,
      status: { $nin: ['cancelled', 'departed'] },
      $expr: { $lt: [`$booked.${seatClass}`, `$capacity.${seatClass}`] },
    },
    { $inc: { [`booked.${seatClass}`]: 1 } },
    { new: true }
  );
}

/** Gives a held seat back to the pool (never drops below zero). */
function releaseSeat(flightId, seatClass) {
  return Flight.updateOne(
    { _id: flightId, [`booked.${seatClass}`]: { $gt: 0 } },
    { $inc: { [`booked.${seatClass}`]: -1 } }
  );
}

module.exports = { reserveSeat, releaseSeat };
