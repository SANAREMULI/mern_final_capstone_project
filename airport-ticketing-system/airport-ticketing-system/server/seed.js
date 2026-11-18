/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Airport = require('./models/Airport');
const Flight = require('./models/Flight');
const Ticket = require('./models/Ticket');
const User = require('./models/User');
const WaitlistEntry = require('./models/WaitlistEntry');
const { ROLES } = require('./utils/constants');

const DAYS_AHEAD = 21;

const AIRPORTS = [
  { code: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya' },
  { code: 'MBA', name: 'Moi International', city: 'Mombasa', country: 'Kenya' },
  { code: 'KIS', name: 'Kisumu International', city: 'Kisumu', country: 'Kenya' },
  { code: 'EDL', name: 'Eldoret International', city: 'Eldoret', country: 'Kenya' },
  { code: 'MYD', name: 'Malindi Airport', city: 'Malindi', country: 'Kenya' },
  { code: 'EBB', name: 'Entebbe International', city: 'Entebbe', country: 'Uganda' },
  { code: 'DAR', name: 'Julius Nyerere International', city: 'Dar es Salaam', country: 'Tanzania' },
  { code: 'KGL', name: 'Kigali International', city: 'Kigali', country: 'Rwanda' },
  { code: 'ADD', name: 'Bole International', city: 'Addis Ababa', country: 'Ethiopia' },
  { code: 'JNB', name: 'O. R. Tambo International', city: 'Johannesburg', country: 'South Africa' },
];

// [flightNumber, airline, from, to, departure hour (local, UTC+3), duration minutes, economy KES, business KES]
const ROUTES = [
  ['KQ600', 'Kenya Airways', 'NBO', 'MBA', 7, 60, 8500, 21000],
  ['KQ601', 'Kenya Airways', 'MBA', 'NBO', 10, 60, 8500, 21000],
  ['JM210', 'Jambojet', 'NBO', 'KIS', 8, 50, 5200, 13000],
  ['JM211', 'Jambojet', 'KIS', 'NBO', 11, 50, 5200, 13000],
  ['JM330', 'Jambojet', 'NBO', 'EDL', 14, 45, 4800, 12000],
  ['5H120', 'Safarilink', 'NBO', 'MYD', 9, 75, 9800, 22000],
  ['KQ412', 'Kenya Airways', 'NBO', 'EBB', 16, 70, 19500, 48000],
  ['KQ482', 'Kenya Airways', 'NBO', 'DAR', 18, 85, 22000, 52000],
  ['WB461', 'RwandAir', 'NBO', 'KGL', 13, 90, 21000, 50000],
  ['ET309', 'Ethiopian Airlines', 'NBO', 'ADD', 6, 120, 26000, 64000],
  ['KQ760', 'Kenya Airways', 'NBO', 'JNB', 22, 250, 46000, 115000],
];

function departureFor(dayOffset, localHour) {
  const date = new Date();
  date.setUTCHours(localHour - 3, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date;
}

async function seed() {
  await connectDB();
  await Promise.all([Ticket, WaitlistEntry, Flight, Airport, User].map((m) => m.deleteMany({})));
  await Promise.all([Ticket, WaitlistEntry, Flight].map((m) => m.syncIndexes()));

  const airports = await Airport.insertMany(AIRPORTS);
  const byCode = Object.fromEntries(airports.map((a) => [a.code, a._id]));

  const flights = [];
  for (let day = 1; day <= DAYS_AHEAD; day += 1) {
    ROUTES.forEach(([flightNumber, airline, from, to, hour, minutes, economy, business]) => {
      const departureTime = departureFor(day, hour);
      const isLongHaul = minutes > 120;
      flights.push({
        flightNumber,
        airline,
        origin: byCode[from],
        destination: byCode[to],
        departureTime,
        arrivalTime: new Date(departureTime.getTime() + minutes * 60000),
        aircraft: isLongHaul ? 'Boeing 787-8' : 'Embraer E190',
        gate: `${String.fromCharCode(65 + (day % 4))}${(hour % 12) + 1}`,
        rows: isLongHaul ? 30 : 20,
        seatsPerRow: isLongHaul ? 6 : 4,
        businessRows: isLongHaul ? 4 : 3,
        price: { economy, business },
      });
    });
  }
  // Flight.create runs the pre-validate hook that derives capacity.
  await Flight.create(flights);

  await User.create([
    { name: 'Ops Admin', email: 'admin@skygate.test', password: 'Admin123!', role: ROLES.ADMIN },
    { name: 'Wanjiku Demo', email: 'passenger@skygate.test', password: 'Passenger123!' },
  ]);

  console.log(`Seeded ${airports.length} airports, ${flights.length} flights and 2 users.`);
  console.log('Admin login:     admin@skygate.test / Admin123!');
  console.log('Passenger login: passenger@skygate.test / Passenger123!');
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
