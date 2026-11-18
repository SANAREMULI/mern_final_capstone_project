import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSavedFlights } from '../context/SavedFlightsContext';
import { formatDate, formatDuration, formatMoney, formatTime } from '../utils/format';
import StatusBadge from './StatusBadge';

function SeatsLeft({ count, label }) {
  if (count === undefined) return null;
  const tone = count === 0 ? 'danger' : count <= 5 ? 'warn' : 'muted';
  return (
    <span className={`seats-left seats-left--${tone}`}>
      {count === 0 ? `${label} full` : `${count} ${label.toLowerCase()} left`}
    </span>
  );
}

export default function FlightCard({ flight }) {
  const { user } = useAuth();
  const { isSaved, toggle } = useSavedFlights();
  const saved = isSaved(flight._id);

  return (
    <article className="flight-card card">
      <header className="flight-card__head">
        <div>
          <strong>{flight.airline}</strong>
          <span className="muted"> · {flight.flightNumber}</span>
        </div>
        {flight.status !== 'scheduled' && <StatusBadge status={flight.status} />}
      </header>

      <div className="route">
        <div>
          <div className="route__time">{formatTime(flight.departureTime)}</div>
          <div className="route__code">{flight.origin?.code}</div>
        </div>
        <div className="route__line">
          <span>{formatDuration(flight.durationMinutes)}</span>
        </div>
        <div className="route__end">
          <div className="route__time">{formatTime(flight.arrivalTime)}</div>
          <div className="route__code">{flight.destination?.code}</div>
        </div>
      </div>

      <div className="flight-card__meta">
        <span>{formatDate(flight.departureTime)}</span>
        <SeatsLeft count={flight.seatsAvailable?.economy} label="Economy" />
        <SeatsLeft count={flight.seatsAvailable?.business} label="Business" />
      </div>

      <footer className="flight-card__foot">
        <div>
          <span className="muted">from</span>{' '}
          <strong className="price">{formatMoney(flight.price?.economy)}</strong>
        </div>
        <div className="row-gap">
          {user && (
            <button
              type="button"
              className={`btn btn--icon ${saved ? 'is-active' : ''}`}
              onClick={() => toggle(flight)}
              aria-pressed={saved}
              aria-label={saved ? 'Remove from saved flights' : 'Save flight'}
              title={saved ? 'Saved' : 'Save for later'}
            >
              {saved ? '★' : '☆'}
            </button>
          )}
          <Link to={`/flights/${flight._id}`} className="btn btn--primary btn--sm">Select</Link>
        </div>
      </footer>
    </article>
  );
}
