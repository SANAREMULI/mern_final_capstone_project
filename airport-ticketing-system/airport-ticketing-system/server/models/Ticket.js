const crypto = require('crypto');
const mongoose = require('mongoose');
const { SEAT_CLASSES, TICKET_STATUS, ACTIVE_TICKET_STATUSES } = require('../utils/constants');

const PNR_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePnr() {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes, (b) => PNR_ALPHABET[b % PNR_ALPHABET.length]).join('');
}

const ticketSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, unique: true, default: generatePnr },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
    passenger: {
      firstName: { type: String, required: true, trim: true, maxlength: 50 },
      lastName: { type: String, required: true, trim: true, maxlength: 50 },
      email: { type: String, required: true, trim: true, lowercase: true },
    },
    seatClass: { type: String, enum: SEAT_CLASSES, required: true },
    seat: { type: String, uppercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(TICKET_STATUS), default: TICKET_STATUS.PENDING },
    // Mirrors status so a partial unique index can stop two active tickets sharing a seat.
    active: { type: Boolean, default: true },
    adminNote: { type: String, trim: true, maxlength: 300 },
    fromWaitlist: { type: Boolean, default: false },
    checkedInAt: Date,
  },
  { timestamps: true }
);

ticketSchema.index(
  { flight: 1, seat: 1 },
  { unique: true, partialFilterExpression: { active: true, seat: { $type: 'string' } } }
);
ticketSchema.index({ user: 1, createdAt: -1 });
ticketSchema.index({ status: 1, createdAt: -1 });

ticketSchema.pre('validate', function syncActive(next) {
  this.active = ACTIVE_TICKET_STATUSES.includes(this.status);
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
