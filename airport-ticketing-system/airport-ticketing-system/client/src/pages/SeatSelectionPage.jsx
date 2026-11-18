import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { flightApi, ticketApi } from '../api';
import useAsync from '../hooks/useAsync';
import SeatMap from '../components/SeatMap';
import { Alert, Spinner } from '../components/Feedback';
import { capitalize } from '../utils/format';

export default function SeatSelectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const { data, loading, error, reload } = useAsync(async () => {
    const ticket = await ticketApi.get(id);
    const layout = await flightApi.seats(ticket.flight._id);
    return { ticket, layout };
  }, [id]);

  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (loading && !data) return <Spinner />;
  if (error) return <div className="container section"><Alert>{error.message}</Alert></div>;

  const { ticket, layout } = data;
  const chosen = selected || ticket.seat;

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await ticketApi.selectSeat(ticket._id, selected);
      navigate('/trips');
    } catch (err) {
      setSaveError(err.message);
      if (err.status === 409) {
        setSelected(null);
        reload();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container section stack">
      <Link to="/trips" className="back-link">← My trips</Link>
      {state?.justBooked && (
        <Alert type="success">
          Booking {ticket.bookingRef} received! Pick a seat now or later from My trips.
        </Alert>
      )}

      <div className="seat-page">
        <div className="card">
          <SeatMap
            layout={layout}
            seatClass={ticket.seatClass}
            selected={chosen}
            currentSeat={ticket.seat}
            onSelect={setSelected}
          />
        </div>

        <aside className="card stack seat-page__summary">
          <h1 className="h3">{ticket.flight.origin.code} → {ticket.flight.destination.code}</h1>
          <p className="muted">{ticket.flight.flightNumber} · {capitalize(ticket.seatClass)} cabin</p>
          <p className="seat-page__chosen">
            Seat <strong>{chosen || '—'}</strong>
          </p>
          <Alert onClose={() => setSaveError('')}>{saveError}</Alert>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!selected || selected === ticket.seat || saving}
            onClick={save}
          >
            {saving ? 'Saving…' : 'Confirm seat'}
          </button>
          <Link to="/trips" className="btn btn--ghost">Skip for now</Link>
        </aside>
      </div>
    </div>
  );
}
