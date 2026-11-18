const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Converts known library errors into clean API responses. */
function normalize(err) {
  if (err instanceof ApiError) return err;
  if (err.name === 'CastError') return ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  if (err.name === 'ValidationError') {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message])
    );
    return ApiError.badRequest('Validation failed', details);
  }
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    return ApiError.conflict(`Duplicate value for ${fields}`);
  }
  if (err.type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON body');
  return new ApiError(500, 'Something went wrong on our side');
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const apiError = normalize(err);
  if (apiError.statusCode >= 500 && process.env.NODE_ENV !== 'test') console.error(err);

  res.status(apiError.statusCode).json({
    message: apiError.message,
    ...(apiError.details && { details: apiError.details }),
    ...(process.env.NODE_ENV === 'development' && apiError.statusCode >= 500 && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
