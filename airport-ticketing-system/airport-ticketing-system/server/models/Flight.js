const mongoose = require('mongoose');
const { FLIGHT_STATUS, SEAT_LETTERS } = require('../utils/constants');

const perClass = (extra = {}) => ({
  economy: { type: Number, min: 0, ...extra },
  business: { type: Number, min: 0, ...extra },
});

const flightSchema = new mongoose.Schema(
  {
    flightNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{2}\d{1,4}$/, 'Flight number must look like KQ100'],
    },
    airline: { type: String, required: true, trim: true },
    origin: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', required: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', required: true },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    aircraft: { type: String, trim: true, default: 'Boeing 737-800' },
    gate: { type: String, trim: true, default: 'TBA' },
    status: { type: String, enum: FLIGHT_STATUS, default: 'scheduled' },

    // Seat layout: rows 1..businessRows are business class, the rest economy.
    rows: { type: Number, required: true, min: 1, max: 80 },
    seatsPerRow: { type: Number, required: true, min: 2, max: SEAT_LETTERS.length },
    businessRows: { type: Number, default: 0, min: 0 },

    price: {
      economy: { type: Number, required: true, min: 0 },
      business: { type: Number, required: true, min: 0 },
    },

    // Derived capacity and an atomic counter of seats held by active tickets.
    capacity: perClass(),
    booked: perClass({ default: 0 }),
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

flightSchema.index({ flightNumber: 1, departureTime: 1 }, { unique: true });
flightSchema.index({ origin: 1, destination: 1, departureTime: 1 });

flightSchema.virtual('seatsAvailable').get(function seatsAvailable() {
  if (!this.capacity || !this.booked) return undefined;
  return {
    economy: Math.max(this.capacity.economy - this.booked.economy, 0),
    business: Math.max(this.capacity.business - this.booked.business, 0),
  };
});

flightSchema.virtual('durationMinutes').get(function durationMinutes() {
  if (!this.departureTime || !this.arrivalTime) return undefined;
  return Math.round((this.arrivalTime - this.departureTime) / 60000);
});

flightSchema.pre('validate', function deriveCapacity(next) {
  if (String(this.origin) === String(this.destination)) {
    this.invalidate('destination', 'Origin and destination must differ');
  }
  if (this.arrivalTime <= this.departureTime) {
    this.invalidate('arrivalTime', 'Arrival must be after departure');
  }
  if (this.businessRows > this.rows) {
    this.invalidate('businessRows', 'Business rows cannot exceed total rows');
  }
  this.capacity = {
    business: this.businessRows * this.seatsPerRow,
    economy: (this.rows - this.businessRows) * this.seatsPerRow,
  };
  next();
});

/** Returns 'business' or 'economy' for a seat label such as "3C", or null if invalid. */
flightSchema.methods.classForSeat = function classForSeat(seat) {
  const match = /^(\d{1,2})([A-Z])$/.exec(String(seat).toUpperCase());
  if (!match) return null;
  const row = Number(match[1]);
  const letterIndex = SEAT_LETTERS.indexOf(match[2]);
  if (row < 1 || row > this.rows || letterIndex < 0 || letterIndex >= this.seatsPerRow) return null;
  return row <= this.businessRows ? 'business' : 'economy';
};

module.exports = mongoose.model('Flight', flightSchema);
