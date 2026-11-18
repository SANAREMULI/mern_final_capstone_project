import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { flightApi, ticketApi, waitlistApi } from '../api';
import useAsync from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { useSavedFlights } from '../context/SavedFlightsContext';
import PassengerForm from '../components/PassengerForm';
import StatusBadge from '../components/StatusBadge';
import { Alert, Spinner } from '../components/Feedback';
import { formatDateTime, formatDuration, formatMoney } from '../utils/format';

const CABINS = ['economy', 'business'];

function CabinOption({ cabin, flight, selected, onSelect }) {
  const left = flight.seatsAvailable[cabin];
  return (
    <button
      type="button"
      className={`cabin ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(cabin)}
      aria-pressed={selected}
    >
      <span className="cabin__name">{cabin === 'business' ? 'Business' : 'Economy'}</span>
      <strong className="price">{formatMoney(flight.price[cabin])}</strong>
      <span className="muted">
        {left > 0 ? `${left} seats left` : `Full · ${flight.waitlistCounts[cabin]} waiting`}
      </span>
    </button>
  );
}

export default function FlightDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSaved, toggle } = useSavedFlights();
  const { data: flight, loading, error } = useAsync(() => flightApi.get(id), [id]);

  const [cabin, setCabin] = useState('economy');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  if (loading) return <Spinner />;
  if (error) return <div className="container section"><Alert>{error.message}</Alert></div>;

  const soldOut = flight.seatsAvailable[cabin] === 0;
  const closed = ['cancelled', 'departed'].includes(flight.status) || new Date(flight.departureTime) <= new Date();

  const book = async (passenger) => {
    setBusy(true);
    setMessage(null);
    try {
      const ticket = await ticketApi.book({ flightId: flight._id, seatClass: cabin, passenger });
      navigate(`/tickets/${ticket._id}/seat`, { state: { justBooked: true } });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const joinWaitlist = async (passenger) => {
    setBusy(true);
    setMessage(null);
    try {
      const entry = await waitlistApi.join({ flightId: flight._id, seatClass: cabin, passenger });
      setMessage({
        type: 'success',
        text: `You're #${entry.position} on the ${cabin} waitlist. We'll issue a ticket automatically if a seat opens.`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section detail">
      <Link to="/" className="back-link">← Back to search</Link>

      <div className="detail__grid">
        <section className="card stack">
          <div className="row-between">
            <div>
              <h1 className="h2">{flight.origin.city} → {flight.destination.city}</h1>
              <p className="muted">{flight.airline} · {flight.flightNumber} · {flight.aircraft}</p>
            </div>
            <StatusBadge status={flight.status} />
          </div>

          <dl className="facts">
            <div><dt>Departs</dt><dd>{formatDateTime(flight.departureTime)}</dd><dd className="muted">{flight.origin.name} ({flight.origin.code})</dd></div>
            <div><dt>Arrives</dt><dd>{formatDateTime(flight.arrivalTime)}</dd><dd className="muted">{flight.destination.name} ({flight.destination.code})</dd></div>
            <div><dt>Duration</dt><dd>{formatDuration(flight.durationMinutes)}</dd></div>
            <div><dt>Gate</dt><dd>{flight.gate}</dd></div>
          </dl>

          {user && (
            <button type="button" className="btn btn--ghost" onClick={() => toggle(flight)}>
              {isSaved(flight._id) ? '★ Saved' : '☆ Save for later'}
            </button>
          )}
        </section>

        <aside className="card stack">
          <h2 className="h3">Choose your cabin</h2>
          <div className="cabins">
            {CABINS.map((c) => (
              <CabinOption key={c} cabin={c} flight={flight} selected={cabin === c} onSelect={setCabin} />
            ))}
          </div>

          {message && <Alert type={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

          {closed && <Alert type="info">This flight is no longer available for booking.</Alert>}

          {!closed && !user && (
            <Link to="/login" state={{ from: { pathname: `/flights/${flight._id}` } }} className="btn btn--primary">
              Log in to book
            </Link>
          )}

          {!closed && user && (
            <>
              {soldOut && (
                <Alert type="info">
                  {cabin} is full. Join the waitlist and you'll be ticketed automatically when a seat is released.
                </Alert>
              )}
              <PassengerForm
                key={cabin}
                busy={busy}
                submitLabel={soldOut ? 'Join waitlist' : `Book ${cabin} · ${formatMoney(flight.price[cabin])}`}
                onSubmit={soldOut ? joinWaitlist : book}
              />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
