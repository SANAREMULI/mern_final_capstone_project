const ROLES = Object.freeze({ PASSENGER: 'passenger', ADMIN: 'admin' });

const SEAT_CLASSES = Object.freeze(['economy', 'business']);

const SEAT_LETTERS = 'ABCDEFGHJK'.split('');

const FLIGHT_STATUS = Object.freeze(['scheduled', 'delayed', 'boarding', 'departed', 'cancelled']);

const TICKET_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
});

/** Statuses that hold a seat on the aircraft. */
const ACTIVE_TICKET_STATUSES = Object.freeze([
  TICKET_STATUS.PENDING,
  TICKET_STATUS.CONFIRMED,
  TICKET_STATUS.CHECKED_IN,
]);

const WAITLIST_STATUS = Object.freeze({
  WAITING: 'waiting',
  PROMOTED: 'promoted',
  LEFT: 'left',
});

/** Online check-in opens this many hours before departure. */
const CHECK_IN_WINDOW_HOURS = 48;

module.exports = {
  ROLES,
  SEAT_CLASSES,
  SEAT_LETTERS,
  FLIGHT_STATUS,
  TICKET_STATUS,
  ACTIVE_TICKET_STATUSES,
  WAITLIST_STATUS,
  CHECK_IN_WINDOW_HOURS,
};
