const request = require('supertest');
const Flight = require('../models/Flight');
const {
  app, startDb, stopDb, clearDb, registerAndLogin, createAdmin, createFlight,
} = require('./setup');

beforeAll(startDb);
afterEach(clearDb);
afterAll(stopDb);

const passenger = { firstName: 'Brian', lastName: 'Otieno' };
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const book = (token, flightId, seatClass = 'business') =>
  request(app).post('/api/tickets').set(auth(token)).send({ flightId, seatClass, passenger });

describe('Ticket booking flow', () => {
  it('books, selects a seat, confirms and lists the ticket', async () => {
    const flight = await createFlight();
    const { token } = await registerAndLogin();
    const admin = await createAdmin();

    const booked = await book(token, flight._id);
    expect(booked.status).toBe(201);
    expect(booked.body.status).toBe('pending');
    expect(booked.body.bookingRef).toMatch(/^[A-Z0-9]{6}$/);

    const seat = await request(app)
      .patch(`/api/tickets/${booked.body._id}/seat`).set(auth(token)).send({ seat: '1A' });
    expect(seat.status).toBe(200);

    const confirmed = await request(app)
      .patch(`/api/tickets/${booked.body._id}/status`).set(auth(admin.token)).send({ status: 'confirmed' });
    expect(confirmed.body.status).toBe('confirmed');

    const mine = await request(app).get('/api/tickets/mine').set(auth(token));
    expect(mine.body).toHaveLength(1);
  });

  it('prevents two passengers from taking the same seat', async () => {
    const flight = await createFlight();
    const a = await registerAndLogin();
    const b = await registerAndLogin();
    const ticketA = (await book(a.token, flight._id)).body;
    const ticketB = (await book(b.token, flight._id)).body;

    await request(app).patch(`/api/tickets/${ticketA._id}/seat`).set(auth(a.token)).send({ seat: '1B' });
    const clash = await request(app)
      .patch(`/api/tickets/${ticketB._id}/seat`).set(auth(b.token)).send({ seat: '1B' });
    expect(clash.status).toBe(409);
  });

  it('rejects a seat from the wrong cabin', async () => {
    const flight = await createFlight();
    const { token } = await registerAndLogin();
    const ticket = (await book(token, flight._id, 'economy')).body;

    const res = await request(app)
      .patch(`/api/tickets/${ticket._id}/seat`).set(auth(token)).send({ seat: '1A' });
    expect(res.status).toBe(400);
  });

  it('never oversells under concurrent bookings', async () => {
    const flight = await createFlight(); // 2 business seats
    const users = await Promise.all([1, 2, 3, 4, 5].map(() => registerAndLogin()));

    const results = await Promise.all(users.map((u) => book(u.token, flight._id)));
    expect(results.filter((r) => r.status === 201)).toHaveLength(2);
    expect(results.filter((r) => r.status === 409)).toHaveLength(3);

    const fresh = await Flight.findById(flight._id);
    expect(fresh.booked.business).toBe(2);
  });

  it('hides other passengers\' tickets', async () => {
    const flight = await createFlight();
    const owner = await registerAndLogin();
    const stranger = await registerAndLogin();
    const ticket = (await book(owner.token, flight._id)).body;

    const res = await request(app).get(`/api/tickets/${ticket._id}`).set(auth(stranger.token));
    expect(res.status).toBe(404);
  });
});

describe('Waitlist (advanced feature)', () => {
  it('promotes the first waiting passenger when a seat frees up', async () => {
    const flight = await createFlight();
    const [a, b, waiter] = await Promise.all([1, 2, 3].map(() => registerAndLogin()));

    const ticketA = (await book(a.token, flight._id)).body;
    await book(b.token, flight._id);

    const full = await book(waiter.token, flight._id);
    expect(full.status).toBe(409);
    expect(full.body.details.canJoinWaitlist).toBe(true);

    const joined = await request(app).post('/api/waitlist').set(auth(waiter.token))
      .send({ flightId: flight._id, seatClass: 'business', passenger });
    expect(joined.status).toBe(201);
    expect(joined.body.position).toBe(1);

    const cancelled = await request(app).patch(`/api/tickets/${ticketA._id}/cancel`).set(auth(a.token));
    expect(cancelled.body.status).toBe('cancelled');

    const waiterTickets = await request(app).get('/api/tickets/mine').set(auth(waiter.token));
    expect(waiterTickets.body).toHaveLength(1);
    expect(waiterTickets.body[0].fromWaitlist).toBe(true);

    const entries = await request(app).get('/api/waitlist/mine').set(auth(waiter.token));
    expect(entries.body[0].status).toBe('promoted');
  });

  it('refuses to waitlist when seats are still available', async () => {
    const flight = await createFlight();
    const { token } = await registerAndLogin();
    const res = await request(app).post('/api/waitlist').set(auth(token))
      .send({ flightId: flight._id, seatClass: 'economy', passenger });
    expect(res.status).toBe(400);
  });
});

describe('Flight search', () => {
  it('filters by route and ignores operator injection in the query string', async () => {
    await createFlight();
    const hit = await request(app).get('/api/flights?origin=NBO&destination=MBA');
    expect(hit.body.total).toBe(1);

    const miss = await request(app).get('/api/flights?origin=MBA&destination=NBO');
    expect(miss.body.total).toBe(0);

    // With the flat query parser "status[$ne]" is just an unknown key, so it is ignored
    // and the default filter applies (an object would never reach Mongo as an operator).
    const injected = await request(app).get('/api/flights?status[$ne]=cancelled');
    expect(injected.status).toBe(200);
    expect(injected.body.total).toBe(1);
  });
});
