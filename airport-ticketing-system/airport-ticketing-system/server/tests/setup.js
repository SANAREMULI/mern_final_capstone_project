const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Airport = require('../models/Airport');
const Flight = require('../models/Flight');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

let mongo;

async function startDb() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}

async function stopDb() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}

async function clearDb() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

async function registerAndLogin(overrides = {}) {
  const body = {
    name: 'Test Passenger',
    email: `user${Date.now()}${Math.random().toString(16).slice(2)}@test.com`,
    password: 'Password123',
    ...overrides,
  };
  const res = await request(app).post('/api/users/register').send(body);
  return { token: res.body.token, user: res.body.user };
}

async function createAdmin() {
  const admin = await User.create({
    name: 'Admin', email: `admin${Date.now()}@test.com`, password: 'Password123', role: 'admin',
  });
  const res = await request(app)
    .post('/api/users/login')
    .send({ email: admin.email, password: 'Password123' });
  return { token: res.body.token, user: admin };
}

async function createFlight(overrides = {}) {
  const [nbo, mba] = await Airport.create([
    { code: 'NBO', name: 'Jomo Kenyatta', city: 'Nairobi', country: 'Kenya' },
    { code: 'MBA', name: 'Moi International', city: 'Mombasa', country: 'Kenya' },
  ]);
  const departureTime = new Date(Date.now() + 24 * 3600 * 1000);
  return Flight.create({
    flightNumber: 'KQ600',
    airline: 'Kenya Airways',
    origin: nbo._id,
    destination: mba._id,
    departureTime,
    arrivalTime: new Date(departureTime.getTime() + 3600 * 1000),
    rows: 2,
    seatsPerRow: 2,
    businessRows: 1,
    price: { economy: 8000, business: 20000 },
    ...overrides,
  });
}

module.exports = { app, startDb, stopDb, clearDb, registerAndLogin, createAdmin, createFlight };
