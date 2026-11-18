import FlightCard from './FlightCard';

export default function FlightGrid({ flights }) {
  return (
    <div className="grid">
      {flights.map((flight) => <FlightCard key={flight._id} flight={flight} />)}
    </div>
  );
}
