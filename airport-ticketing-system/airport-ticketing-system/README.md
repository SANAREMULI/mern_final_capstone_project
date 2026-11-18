# ✈ SkyGate — Airport Ticketing System (MERN)

A full-stack airport ticketing platform built for the PLP **Team-Based Final Capstone**.
Passengers search flights, save favourites, book tickets, pick seats on an interactive seat map, check in online and get a printable boarding pass. Airline staff approve bookings, manage flights and airports, and monitor load factors on an admin dashboard.

> **Live demo:** _add your frontend URL here_ · **API:** _add your backend URL here_

---

## Capstone requirement mapping

The capstone brief was written for a library system. Each core area maps to an airport equivalent:

| Capstone requirement | SkyGate feature |
|---|---|
| Catalog browsing / search | Flight search by route, date, cabin, sort, paging |
| Auth (JWT, protected routes, roles) | Passenger and admin accounts, `protect` / `isAdmin` middleware |
| Reading list (shared state) | **Saved flights**, held in React Context and stored on the server |
| Borrow request tracking | **Ticket lifecycle**: `pending → confirmed → checked_in`, or `cancelled` / `rejected` |
| Space booking with conflict check | **Seat selection**, where a unique DB index makes double-booking a seat impossible |
| Admin dashboard | Stats, ticket approval queue, flight/airport CRUD, load factors |
| **Advanced feature** | **Waitlist for sold-out cabins**: queued passengers get a ticket automatically, first come first served, when a seat frees up |

## Features

**Passengers**
- Search flights (origin, destination, date, cabin, cheapest or earliest first) with shareable URL state
- Save flights for later (★)
- Book economy or business; each fare is locked in at the moment of booking
- Choose a seat on a live seat map (taken seats and seats in the other cabin are disabled)
- Online check-in opens 48 h before departure and needs a confirmed ticket and an assigned seat
- Printable boarding pass
- Join the waitlist when a cabin is full and see your place in the queue

**Admins**
- Overview: pending approvals, revenue, waitlist size, ticket pipeline, load factor for the next departures
- Approve or reject pending tickets, with a reason shown to the passenger
- Create, edit, cancel and delete flights. Cancelling a flight also cancels its tickets and clears its waitlist.
- Manage airports
- View every waitlist queue

## Engineering highlights
- **No overselling under concurrency.** Seat inventory is held with one atomic conditional `$inc` (`booked < capacity`). Five passengers racing for the last two seats always gives exactly two tickets (covered by a test).
- **No seat double-booking.** A partial unique index on `{flight, seat}` covers active tickets only, so two passengers can never share a seat.
- **Self-healing waitlist.** When a ticket is cancelled or rejected, its seat goes back into inventory and the next passenger in the queue gets a ticket. If a step fails partway, the earlier steps are reversed.
- **Security.** bcrypt (12 rounds), JWT, Helmet, a CORS allow-list, rate-limited auth routes, and a flat query parser that blocks `?field[$ne]=` NoSQL injection. Users cannot set their own role. A ticket owned by someone else returns 404, so its existence is not revealed.
- **Clean layering.** Logic is split into routes → controllers → services → models, with central error normalisation (validation, cast and duplicate-key errors become clean 4xx JSON).

## Tech stack
| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router 6, Context API, plain CSS design system (responsive, print styles) |
| Backend | Node 18+, Express 4, Mongoose 8, JWT, bcryptjs, Helmet, express-rate-limit |
| Database | MongoDB (Atlas in production) |
| Testing | Jest + Supertest + mongodb-memory-server (API), Vitest (client utils) |
| CI | GitHub Actions: API tests, client tests and production build on every push / PR |

## Project structure
```
airport-ticketing-system/
├── server/
│   ├── config/db.js
│   ├── controllers/      userController, airportController, flightController,
│   │                     ticketController, waitlistController, adminController
│   ├── models/           User, Airport, Flight, Ticket, WaitlistEntry
│   ├── routes/           one router per resource
│   ├── middleware/       authMiddleware (protect, isAdmin), errorHandler, validate
│   ├── services/         seatInventory, ticketService, waitlistService
│   ├── utils/            ApiError, asyncHandler, constants, token
│   ├── tests/            auth.test.js, tickets.test.js, setup.js
│   ├── app.js            express app (exported for tests)
│   ├── server.js         entry point
│   └── seed.js           demo airports, 3 weeks of flights, demo users
├── client/
│   └── src/
│       ├── api/          fetch wrapper + endpoint functions
│       ├── components/   Navbar, FlightCard, FlightGrid, SearchBar, SeatMap,
│       │                 PassengerForm, ProtectedRoute, StatusBadge, Pagination…
│       ├── context/      AuthContext, SavedFlightsContext
│       ├── hooks/        useAsync
│       ├── pages/        Home, FlightDetail, Login, Register, SavedFlights,
│       │                 MyTrips, SeatSelection, BoardingPass, admin/*
│       ├── styles/       index.css (design tokens + components)
│       └── utils/        format helpers (+ tests)
├── docs/                 postman_collection.json, contribution-logs/
├── .github/workflows/    ci.yml
├── CONTRIBUTING.md       branching + PR workflow
├── DEPLOYMENT.md
└── README.md
```

## Getting started

**Prerequisites:** Node 18+, plus MongoDB running locally or a MongoDB Atlas connection string.

```bash
# 1. API
cd server
cp .env.example .env        # set MONGO_URI and JWT_SECRET
npm install
npm run seed                # demo data
npm run dev                 # http://localhost:5000/api/health

# 2. Client (new terminal)
cd client
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173
```

**Demo accounts (after seeding)**

| Role | Email | Password |
|---|---|---|
| Admin | admin@skygate.test | Admin123! |
| Passenger | passenger@skygate.test | Passenger123! |

### Tests
```bash
cd server && npm test      # API integration tests (in-memory MongoDB)
cd client && npm test      # client unit tests
```

## API reference

All endpoints are prefixed with `/api`. 🔒 = needs a Bearer token, 🛡 = admin only.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users/register` | Create passenger account → `{ token, user }` |
| POST | `/users/login` | Log in → `{ token, user }` |
| GET 🔒 | `/users/me` | Current user |
| GET 🔒 | `/users/me/saved` | Saved flights |
| POST/DELETE 🔒 | `/users/me/saved/:flightId` | Save / unsave a flight |
| GET | `/airports` | List airports |
| POST/PUT/DELETE 🛡 | `/airports[/:id]` | Manage airports |
| GET | `/flights?origin=NBO&destination=MBA&departAfter=&departBefore=&seatClass=&q=&sort=price&page=1&limit=12` | Search |
| GET | `/flights/:id` | Flight detail + availability + waitlist counts |
| GET | `/flights/:id/seats` | Seat layout + occupied seats |
| POST/PUT/DELETE 🛡 | `/flights[/:id]` | Manage flights |
| POST 🔒 | `/tickets` | Book `{ flightId, seatClass, passenger:{firstName,lastName,email} }` (409 + `canJoinWaitlist` when full) |
| GET 🔒 | `/tickets/mine` | My tickets |
| GET 🛡 | `/tickets?status=&q=&page=` | All tickets |
| GET 🔒 | `/tickets/:id` | Ticket (owner or admin) |
| PATCH 🔒 | `/tickets/:id/seat` | Select seat `{ seat: "12A" }` (409 if taken) |
| PATCH 🔒 | `/tickets/:id/check-in` | Online check-in |
| PATCH 🔒 | `/tickets/:id/cancel` | Cancel (frees seat and promotes waitlist) |
| PATCH 🛡 | `/tickets/:id/status` | `{ status: "confirmed" \| "rejected", note }` |
| POST 🔒 | `/waitlist` | Join waitlist for a full cabin |
| GET 🔒 | `/waitlist/mine` | My waitlist entries + position |
| DELETE 🔒 | `/waitlist/:id` | Leave waitlist |
| GET 🛡 | `/waitlist?status=waiting` | All queues |
| GET 🛡 | `/admin/stats` | Dashboard metrics |

A ready-to-import Postman collection is in [`docs/postman_collection.json`](docs/postman_collection.json).

## Screenshots
_Add screenshots to `docs/screenshots/` and reference them here: search, flight detail, seat map, my trips, boarding pass, admin overview, admin tickets._

## Team & contributions
| Member | Role | Contribution log |
|---|---|---|
| _Name_ | Team Lead / PM | [docs/contribution-logs/](docs/contribution-logs/) |
| _Name_ | Backend Lead | |
| _Name_ | Frontend Lead | |
| _Name_ | QA & Deployment Lead | |

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branching and review workflow.
