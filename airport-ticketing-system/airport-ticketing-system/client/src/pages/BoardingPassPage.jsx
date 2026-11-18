import { Link, useParams } from 'react-router-dom';
import { ticketApi } from '../api';
import useAsync from '../hooks/useAsync';
import { Alert, Spinner } from '../components/Feedback';
import { capitalize, formatDate, formatTime } from '../utils/format';

/** Boarding time is 40 minutes before departure. */
const BOARDING_LEAD_MS = 40 * 60 * 1000;

export default function BoardingPassPage() {
  const { id } = useParams();
  const { data: ticket, loading, error } = useAsync(() => ticketApi.get(id), [id]);

  if (loading) return <Spinner />;
  if (error) return <div className="container section"><Alert>{error.message}</Alert></div>;
  if (ticket.status !== 'checked_in') {
    return (
      <div className="container section">
        <Alert type="info">A boarding pass is available after online check-in.</Alert>
        <Link to="/trips">← My trips</Link>
      </div>
    );
  }

  const { flight, passenger } = ticket;
  const boarding = new Date(new Date(flight.departureTime).getTime() - BOARDING_LEAD_MS);

  return (
    <div className="container section stack">
      <div className="row-between no-print">
        <Link to="/trips" className="back-link">← My trips</Link>
        <button type="button" className="btn btn--ghost" onClick={() => window.print()}>Print</button>
      </div>

      <article className="pass">
        <header className="pass__head">
          <span>✈ SkyGate · {flight.flightNumber}</span>
          <span>{capitalize(ticket.seatClass)}</span>
        </header>
        <div className="pass__route">
          <div><strong>{flight.origin.code}</strong><span>{flight.origin.city}</span></div>
          <span className="pass__plane">✈</span>
          <div><strong>{flight.destination.code}</strong><span>{flight.destination.city}</span></div>
        </div>
        <dl className="pass__grid">
          <div><dt>Passenger</dt><dd>{passenger.lastName.toUpperCase()}/{passenger.firstName.toUpperCase()}</dd></div>
          <div><dt>Date</dt><dd>{formatDate(flight.departureTime)}</dd></div>
          <div><dt>Boarding</dt><dd>{formatTime(boarding)}</dd></div>
          <div><dt>Departs</dt><dd>{formatTime(flight.departureTime)}</dd></div>
          <div><dt>Gate</dt><dd>{flight.gate}</dd></div>
          <div><dt>Seat</dt><dd>{ticket.seat}</dd></div>
        </dl>
        <footer className="pass__foot">
          <span className="mono">PNR {ticket.bookingRef}</span>
          <span className="pass__barcode" aria-hidden="true" />
        </footer>
      </article>
    </div>
  );
}
