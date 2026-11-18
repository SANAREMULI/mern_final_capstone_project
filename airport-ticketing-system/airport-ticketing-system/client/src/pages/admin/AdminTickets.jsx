import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ticketApi } from '../../api';
import useAsync from '../../hooks/useAsync';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { Alert, EmptyState, Spinner } from '../../components/Feedback';
import { capitalize, formatDateTime, formatMoney } from '../../utils/format';

const FILTERS = ['', 'pending', 'confirmed', 'checked_in', 'cancelled', 'rejected'];

export default function AdminTickets() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const page = Number(params.get('page')) || 1;
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const { data, loading, reload } = useAsync(
    () => ticketApi.all({ status, page, q: params.get('q') }),
    [params.toString()]
  );

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const review = async (ticket, decision) => {
    const note = decision === 'rejected' ? window.prompt('Reason for rejection (shown to passenger):') : '';
    if (note === null) return;
    setError('');
    try {
      await ticketApi.review(ticket._id, decision, note || undefined);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="chips">
          {FILTERS.map((f) => (
            <button
              key={f || 'all'}
              type="button"
              className={`chip ${status === f ? 'is-active' : ''}`}
              onClick={() => setParam('status', f)}
            >
              {f ? capitalize(f) : 'All'}
            </button>
          ))}
        </div>
        <form className="row-gap" onSubmit={(e) => { e.preventDefault(); setParam('q', query.trim()); }}>
          <input
            className="input"
            placeholder="Booking ref"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search by booking reference"
          />
          <button type="submit" className="btn btn--ghost btn--sm">Find</button>
        </form>
      </div>

      <Alert onClose={() => setError('')}>{error}</Alert>
      {loading && !data && <Spinner />}
      {data?.tickets.length === 0 && <EmptyState title="No tickets found" />}

      {data?.tickets.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Ref</th><th>Passenger</th><th>Flight</th><th>Cabin / seat</th>
                <th>Fare</th><th>Status</th><th>Booked</th><th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.tickets.map((t) => (
                <tr key={t._id}>
                  <td className="mono">{t.bookingRef}</td>
                  <td>
                    {t.passenger.firstName} {t.passenger.lastName}
                    <div className="small muted">{t.user?.email}</div>
                  </td>
                  <td>
                    {t.flight?.flightNumber} · {t.flight?.origin?.code}→{t.flight?.destination?.code}
                    <div className="small muted">{t.flight && formatDateTime(t.flight.departureTime)}</div>
                  </td>
                  <td>{capitalize(t.seatClass)} / {t.seat || '—'}</td>
                  <td>{formatMoney(t.price)}</td>
                  <td><StatusBadge status={t.status} />{t.fromWaitlist && <div className="small muted">via waitlist</div>}</td>
                  <td className="small">{formatDateTime(t.createdAt)}</td>
                  <td>
                    {t.status === 'pending' && (
                      <div className="row-gap">
                        <button type="button" className="btn btn--primary btn--sm" onClick={() => review(t, 'confirmed')}>Confirm</button>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => review(t, 'rejected')}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => setParam('page', p)} />}
    </div>
  );
}
