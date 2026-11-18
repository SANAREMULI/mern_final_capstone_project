const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const userRoutes = require('./routes/userRoutes');
const airportRoutes = require('./routes/airportRoutes');
const flightRoutes = require('./routes/flightRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ApiError = require('./utils/ApiError');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Flat query strings only: blocks ?status[$ne]=x style NoSQL operator injection.
app.set('query parser', 'simple');
app.set('trust proxy', 1);

// CLIENT_URL: comma-separated origins; "*" acts as a wildcard,
// e.g. https://client-*-eplatform.vercel.app for Vercel preview deployments.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)
  .map((origin) => new RegExp(`^${origin.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+')}$`, 'i'));

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.some((pattern) => pattern.test(origin))) return callback(null, true);
    return callback(ApiError.forbidden(`Origin ${origin} not allowed by CORS`));
  },
}));
app.use(express.json({ limit: '100kb' }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serverless entry (api/index.js) registers a lazy DB connector; locally server.js connects up front.
app.use('/api', (req, res, next) => {
  const ensureDB = app.get('ensureDB');
  if (!ensureDB) return next();
  return ensureDB().then(() => next(), (err) => {
    console.error('Database connection failed:', err.message);
    next(new ApiError(503, 'Database unavailable. Please try again shortly.'));
  });
});

app.use('/api/users', userRoutes);
app.use('/api/airports', airportRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
