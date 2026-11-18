import { request } from './client';

export const authApi = {
  register: (body) => request('/users/register', { method: 'POST', body }),
  login: (body) => request('/users/login', { method: 'POST', body }),
  me: () => request('/users/me'),
};

export const savedApi = {
  list: () => request('/users/me/saved'),
  add: (flightId) => request(`/users/me/saved/${flightId}`, { method: 'POST' }),
  remove: (flightId) => request(`/users/me/saved/${flightId}`, { method: 'DELETE' }),
};

export const airportApi = {
  list: () => request('/airports'),
  create: (body) => request('/airports', { method: 'POST', body }),
  update: (id, body) => request(`/airports/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/airports/${id}`, { method: 'DELETE' }),
};

export const flightApi = {
  search: (params) => request('/flights', { params }),
  get: (id) => request(`/flights/${id}`),
  seats: (id) => request(`/flights/${id}/seats`),
  create: (body) => request('/flights', { method: 'POST', body }),
  update: (id, body) => request(`/flights/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/flights/${id}`, { method: 'DELETE' }),
};

export const ticketApi = {
  book: (body) => request('/tickets', { method: 'POST', body }),
  mine: () => request('/tickets/mine'),
  all: (params) => request('/tickets', { params }),
  get: (id) => request(`/tickets/${id}`),
  selectSeat: (id, seat) => request(`/tickets/${id}/seat`, { method: 'PATCH', body: { seat } }),
  checkIn: (id) => request(`/tickets/${id}/check-in`, { method: 'PATCH' }),
  cancel: (id) => request(`/tickets/${id}/cancel`, { method: 'PATCH' }),
  review: (id, status, note) => request(`/tickets/${id}/status`, { method: 'PATCH', body: { status, note } }),
};

export const waitlistApi = {
  join: (body) => request('/waitlist', { method: 'POST', body }),
  mine: () => request('/waitlist/mine'),
  all: (params) => request('/waitlist', { params }),
  leave: (id) => request(`/waitlist/${id}`, { method: 'DELETE' }),
};

export const adminApi = {
  stats: () => request('/admin/stats'),
};
