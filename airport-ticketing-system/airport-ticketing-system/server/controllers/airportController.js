const Airport = require('../models/Airport');
const Flight = require('../models/Flight');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const pick = ({ code, name, city, country }) => ({ code, name, city, country });

// GET /api/airports
const listAirports = asyncHandler(async (req, res) => {
  const airports = await Airport.find().sort({ city: 1 });
  res.json(airports);
});

// POST /api/airports (admin)
const createAirport = asyncHandler(async (req, res) => {
  const airport = await Airport.create(pick(req.body));
  res.status(201).json(airport);
});

// PUT /api/airports/:id (admin)
const updateAirport = asyncHandler(async (req, res) => {
  const airport = await Airport.findByIdAndUpdate(req.params.id, pick(req.body), {
    new: true,
    runValidators: true,
  });
  if (!airport) throw ApiError.notFound('Airport not found');
  res.json(airport);
});

// DELETE /api/airports/:id (admin)
const deleteAirport = asyncHandler(async (req, res) => {
  const inUse = await Flight.exists({
    $or: [{ origin: req.params.id }, { destination: req.params.id }],
  });
  if (inUse) throw ApiError.conflict('Airport is used by existing flights');

  const airport = await Airport.findByIdAndDelete(req.params.id);
  if (!airport) throw ApiError.notFound('Airport not found');
  res.json({ message: 'Airport deleted' });
});

module.exports = { listAirports, createAirport, updateAirport, deleteAirport };
