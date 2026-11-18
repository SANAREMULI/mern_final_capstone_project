const User = require('../models/User');
const Flight = require('../models/Flight');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');

const authResponse = (user) => ({ token: signToken(user), user });

const savedFlightsPopulate = {
  path: 'savedFlights',
  populate: [
    { path: 'origin', select: 'code city' },
    { path: 'destination', select: 'code city' },
  ],
};

// POST /api/users/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (String(password).length < 8) throw ApiError.badRequest('Password must be at least 8 characters');

  const exists = await User.exists({ email: String(email).toLowerCase() });
  if (exists) throw ApiError.conflict('An account with that email already exists');

  // Role is never taken from the request body: admins are created via seed or DB.
  const user = await User.create({ name, email, password });
  res.status(201).json(authResponse(user));
});

// POST /api/users/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  res.json(authResponse(user));
});

// GET /api/users/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// GET /api/users/me/saved
const getSavedFlights = asyncHandler(async (req, res) => {
  await req.user.populate(savedFlightsPopulate);
  res.json(req.user.savedFlights.filter(Boolean));
});

// POST /api/users/me/saved/:flightId
const saveFlight = asyncHandler(async (req, res) => {
  const exists = await Flight.exists({ _id: req.params.flightId });
  if (!exists) throw ApiError.notFound('Flight not found');

  await User.updateOne({ _id: req.user._id }, { $addToSet: { savedFlights: req.params.flightId } });
  res.status(201).json({ message: 'Flight saved', flightId: req.params.flightId });
});

// DELETE /api/users/me/saved/:flightId
const unsaveFlight = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { savedFlights: req.params.flightId } });
  res.json({ message: 'Flight removed', flightId: req.params.flightId });
});

module.exports = { register, login, getMe, getSavedFlights, saveFlight, unsaveFlight };
