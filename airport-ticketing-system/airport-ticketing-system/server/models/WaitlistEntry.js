const mongoose = require('mongoose');
const { SEAT_CLASSES, WAITLIST_STATUS } = require('../utils/constants');

const waitlistEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
    seatClass: { type: String, enum: SEAT_CLASSES, required: true },
    passenger: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
    },
    status: {
      type: String,
      enum: Object.values(WAITLIST_STATUS),
      default: WAITLIST_STATUS.WAITING,
    },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  },
  { timestamps: true }
);

// First-come, first-served queue lookups.
waitlistEntrySchema.index({ flight: 1, seatClass: 1, status: 1, createdAt: 1 });
// A user can only be waiting once per flight and class.
waitlistEntrySchema.index(
  { user: 1, flight: 1, seatClass: 1 },
  { unique: true, partialFilterExpression: { status: WAITLIST_STATUS.WAITING } }
);

module.exports = mongoose.model('WaitlistEntry', waitlistEntrySchema);
