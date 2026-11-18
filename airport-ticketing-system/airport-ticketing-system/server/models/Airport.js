const mongoose = require('mongoose');

const airportSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{3}$/, 'Airport code must be a 3-letter IATA code'],
    },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Airport', airportSchema);
