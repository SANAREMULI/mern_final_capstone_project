import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ticketApi, waitlistApi } from '../api';
import useAsync from '../hooks/useAsync';
import StatusBadge from '../components/StatusBadge';
import { Alert, EmptyState, Spinner } from '../components/Feedback';
import { capitalize, formatDateTime, formatMoney } from '../utils/format';

const isUpcoming = (ticket) => new Date(ticket.flight?.departureTime) > new Date();

function TicketActions({ ticket, onAction }) {
  const editable = ['pending', 'confirmed'].includes(ticket.status) && isUpcoming(ticket);
  return (
    <div className="row-gap wrap">
      {editable && (
        <Link to={`/tickets/${ticket._id}/seat`} className="btn btn--ghost btn--sm">
          {ticket.seat ? 'Change seat' : 'Choose seat'}
        </Link>
      )}
      {ticket.status === 'confirmed' && ticket.seat && isUpcoming(ticket) && (
        <button type="button" className="btn btn--primary btn--sm" onClick={() => onAction('checkIn', ticket)}>
          Check in
        </button>
      )}
      {ticket.status === 'checked_in' && (
        <Link to={`/tickets/${ticket._id}/boarding-pass`} className="btn btn--primary btn--sm">Boarding pass</Link>
      )}
      {editable && (
        <button type="button" className="btn btn--danger btn--sm" onClick={() => onAction('cancel', ticket)}>
          Cancel
        </button>
      )}
    </div>
  );
}

function TicketCard({ ticket, onAction }) {
  const { flight } = ticket;
  return (
    <article className="card trip">
      <div className="row-between">
        <div>
          <h3 className="h3">{flight.origin.code} → {flight.destination.code}</h3>
          <p className="muted">{flight.flightNumber} · {formatDateTime(flight.departureTime)}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>
      <dl className="facts facts--compact">
        <div><dt>Booking ref</dt><dd className="mono">{ticket.bookingRef}</dd></div>
        <div><dt>Passenger</dt><dd>{ticket.passenger.firstName} {ticket.passenger.lastName}</dd></div>
        <div><dt>Cabin</dt><dd>{capitalize(ticket.seatClass)}</dd></div>
        <div><dt>Seat</dt><dd>{ticket.seat || '—'}</dd></div>
        <div><dt>Fare</dt><dd>{formatMoney(ticket.price)}</dd></div>
      </dl>
      {ticket.fromWaitlist && <p className="note">🎉 Issued from the waitlist</p>}
      {ticket.adminNote && <p className="note">Airline note: {ticket.adminNote}</p>}
      {ticket.status === 'pending' && <p className="muted small">Awaiting confirmation by the airline.</p>}
      <TicketActions ticket={ticket} onAction={onAction} />
    </article>
  );
}

function WaitlistCard({ entry, onLeave }) {
  return (
    <article className="card trip">
      <div className="row-between">
        <div>
          <h3 className="h3">{entry.flight.origin.code} → {entry.flight.destination.code}</h3>
          <p className="muted">{entry.flight.flightNumber} · {formatDateTime(entry.flight.departureTime)}</p>
        </div>
        <StatusBadge status={entry.status} />
      </div>
      <p>
        {capitalize(entry.seatClass)} waitlist
        {entry.position && <> · you are <strong>#{entry.position}</strong> in line</>}
      </p>
      {entry.status === 'waiting' && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onLeave(entry)}>Leave waitlist</button>
      )}
    </article>
  );
}

export default function MyTripsPage() {
  const tickets = useAsync(() => ticketApi.mine(), []);
  const waitlist = useAsync(() => waitlistApi.mine(), []);
  const [error, setError] = useState('');

  const handleAction = async (action, ticket) => {
    if (action === 'cancel' && !window.confirm(`Cancel booking ${ticket.bookingRef}? This cannot be undone.`)) return;
    setError('');
    try {
      await ticketApi[action](ticket._id);
      await Promise.all([tickets.reload(), waitlist.reload()]);
    } catch (err) {
      setError(err.message);
    }
  };

  const leave = async (entry) => {
    try {
      await waitlistApi.leave(entry._id);
      await waitlist.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  if (tickets.loading && !tickets.data) return <Spinner />;

  const all = tickets.data || [];
  const upcoming = all.filter((t) => isUpcoming(t) && !['cancelled', 'rejected'].includes(t.status));
  const past = all.filter((t) => !upcoming.includes(t));
  const waiting = (waitlist.data || []).filter((e) => e.status === 'waiting');

  return (
    <div className="container section stack-lg">
      <h1 className="h2">My trips</h1>
      <Alert onClose={() => setError('')}>{error || tickets.error?.message}</Alert>

      <section className="stack">
        <h2 className="h3">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming trips" action={<Link to="/" className="btn btn--primary">Book a flight</Link>} />
        ) : (
          <div className="grid">{upcoming.map((t) => <TicketCard key={t._id} ticket={t} onAction={handleAction} />)}</div>
        )}
      </section>

      {waiting.length > 0 && (
        <section className="stack">
          <h2 className="h3">Waitlists</h2>
          <div className="grid">{waiting.map((e) => <WaitlistCard key={e._id} entry={e} onLeave={leave} />)}</div>
        </section>
      )}

      {past.length > 0 && (
        <section className="stack">
          <h2 className="h3">Past &amp; cancelled</h2>
          <div className="grid">{past.map((t) => <TicketCard key={t._id} ticket={t} onAction={handleAction} />)}</div>
        </section>
      )}
    </div>
  );
}
