import { Link } from 'react-router-dom';
import { useSavedFlights } from '../context/SavedFlightsContext';
import FlightGrid from '../components/FlightGrid';
import { EmptyState, Spinner } from '../components/Feedback';

export default function SavedFlightsPage() {
  const { flights, loading } = useSavedFlights();
  const upcoming = flights.filter((f) => new Date(f.departureTime) > new Date());

  return (
    <div className="container section">
      <div className="section__head">
        <h1 className="h2">Saved flights</h1>
        <span className="muted">{upcoming.length} upcoming</span>
      </div>

      {loading && <Spinner />}
      {!loading && upcoming.length === 0 && (
        <EmptyState
          title="Nothing saved yet"
          action={<Link to="/" className="btn btn--primary">Find flights</Link>}
        >
          Tap the star on any flight to keep it here while you decide.
        </EmptyState>
      )}
      {upcoming.length > 0 && <FlightGrid flights={upcoming} />}
    </div>
  );
}
