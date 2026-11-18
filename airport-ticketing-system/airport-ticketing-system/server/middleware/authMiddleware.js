const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/token');
const { ROLES } = require('../utils/constants');

/** Requires a valid Bearer token and attaches the user to req.user. */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Session expired or invalid, please log in again');
  }

  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  req.user = user;
  next();
});

/** Must run after protect. */
function isAdmin(req, res, next) {
  if (req.user?.role !== ROLES.ADMIN) return next(ApiError.forbidden('Admin access only'));
  return next();
}

module.exports = { protect, isAdmin };
