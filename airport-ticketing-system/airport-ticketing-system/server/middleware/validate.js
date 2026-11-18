const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

/** Rejects the request with 400 if any listed body field is missing or blank. */
const requireFields = (...fields) => (req, res, next) => {
  const missing = fields.filter((field) => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], req.body);
    return value === undefined || value === null || String(value).trim() === '';
  });
  if (missing.length) return next(ApiError.badRequest(`Missing required fields: ${missing.join(', ')}`));
  return next();
};

/** Rejects malformed :id params before they reach the database. */
const validateObjectId = (param = 'id') => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) {
    return next(ApiError.badRequest(`Invalid ${param}`));
  }
  return next();
};

module.exports = { requireFields, validateObjectId };
