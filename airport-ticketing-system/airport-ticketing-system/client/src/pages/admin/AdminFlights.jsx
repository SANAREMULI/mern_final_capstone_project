import { useState } from 'react';
import { airportApi, flightApi } from '../../api';
import useAsync from '../../hooks/useAsync';
import FlightForm from './FlightForm';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { Alert, EmptyState, Spinner } from '../../components/Feedback';
import { formatDateTime, formatMoney } from '../../utils/format';

export default function AdminFlights() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | flight
  const [error, setError] = useState('');

  const airports = useAsync(() => airportApi.list(), []);
  const flights = useAsync(() => flightApi.search({ page, limit: 15, q: search }), [page, search]);

  const save = async (payload) => {
    setError('');
    try {
      if (editing === 'new') await flightApi.create(payload);
      else await flightApi.update(editing._id, payload);
      setEditing(null);
      await flights.reload();
    } catch (err) {
      const details = err.details ? ` (${Object.values(err.details).join('; ')})` : '';
      setError(`${err.message}${details}`);
    }
  };

  const remove = async (flight) => {
    if (!window.confirm(`Delete ${flight.flightNumber}? Flights with bookings must be cancelled instead.`)) return;
    setError('');
    try {
      await flightApi.remove(flight._id);
      await flights.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <form className="row-gap" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(query.trim()); }}>
          <input
            className="input"
            placeholder="Flight number or airline"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search flights"
          />
          <button type="submit" className="btn btn--ghost btn--sm">Search</button>
        </form>
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>+ New flight</button>
      </div>

      <Alert onClose={() => setError('')}>{error}</Alert>

      {editing && airports.data && (
        <FlightForm
          key={editing === 'new' ? 'new' : editing._id}
          flight={editing === 'new' ? null : editing}
          airports={airports.data}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      )}

      {flights.loading && !flights.data && <Spinner />}
      {flights.data?.flights.length === 0 && <EmptyState title="No upcoming flights" />}

      {flights.data?.flights.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr><th>Flight</th><th>Route</th><th>Departs</th><th>Seats sold</th><th>Fares</th><th>Status</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {flights.data.flights.map((f) => (
                <tr key={f._id}>
                  <td><span className="mono">{f.flightNumber}</span><div className="small muted">{f.airline}</div></td>
                  <td>{f.origin?.code} → {f.destination?.code}</td>
                  <td>{formatDateTime(f.departureTime)}</td>
                  <td className="small">
                    Eco {f.booked.economy}/{f.capacity.economy}<br />Bus {f.booked.business}/{f.capacity.business}
                  </td>
                  <td className="small">{formatMoney(f.price.economy)}<br />{formatMoney(f.price.business)}</td>
                  <td><StatusBadge status={f.status} /></td>
                  <td>
                    <div className="row-gap">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setEditing(f); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
                      <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(f)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {flights.data && <Pagination page={flights.data.page} pages={flights.data.pages} onChange={setPage} />}
    </div>
  );
}
