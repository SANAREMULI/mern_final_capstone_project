const request = require('supertest');
const { app, startDb, stopDb, clearDb, registerAndLogin, createAdmin } = require('./setup');

beforeAll(startDb);
afterEach(clearDb);
afterAll(stopDb);

describe('Auth', () => {
  const credentials = { name: 'Amina', email: 'amina@test.com', password: 'Password123' };

  it('registers a passenger and never returns the password', async () => {
    const res = await request(app).post('/api/users/register').send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('passenger');
    expect(res.body.user.password).toBeUndefined();
  });

  it('ignores a role sent in the register body', async () => {
    const res = await request(app).post('/api/users/register').send({ ...credentials, role: 'admin' });
    expect(res.body.user.role).toBe('passenger');
  });

  it('rejects duplicate emails', async () => {
    await request(app).post('/api/users/register').send(credentials);
    const res = await request(app).post('/api/users/register').send(credentials);
    expect(res.status).toBe(409);
  });

  it('logs in with valid credentials and rejects a wrong password', async () => {
    await request(app).post('/api/users/register').send(credentials);

    const ok = await request(app).post('/api/users/login').send(credentials);
    expect(ok.status).toBe(200);

    const bad = await request(app).post('/api/users/login').send({ ...credentials, password: 'nope-nope' });
    expect(bad.status).toBe(401);
  });

  it('protects /me and admin routes', async () => {
    expect((await request(app).get('/api/users/me')).status).toBe(401);

    const { token } = await registerAndLogin();
    const me = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);

    const stats = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(stats.status).toBe(403);

    const admin = await createAdmin();
    const adminStats = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(adminStats.status).toBe(200);
  });
});
