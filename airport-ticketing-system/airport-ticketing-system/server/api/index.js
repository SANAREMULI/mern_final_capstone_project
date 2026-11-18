// Vercel serverless entry point: reuses one MongoDB connection across warm invocations.
const mongoose = require('mongoose');
const app = require('../app');
const connectDB = require('../config/db');

let connecting = null;

app.set('ensureDB', async () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    connecting = connectDB().catch((err) => {
      connecting = null;
      throw err;
    });
  }
  await connecting;
});

module.exports = app;
