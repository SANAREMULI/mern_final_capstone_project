import { Link } from 'react-router-dom';
import { adminApi } from '../../api';
import useAsync from '../../hooks/useAsync';
import { Alert, Spinner } from '../../components/Feedback';
import { capitalize, formatDateTime, formatMoney } from '../../utils/format';

function StatTile({ label, value, to }) {
  const body = (
    <>
      <span className="stat__label">{label}</span>
      <strong className="stat__value">{value}</strong>
    </>
  );
  return to ? <Link to={to} className="card stat stat--link">{body}</Link> : <div className="card stat">{body}</div>;
}

function LoadBar({ percent }) {
  const tone = percent >= 90 ? 'danger' : percent >= 70 ? 'warn' : 'ok';
  return (
    <div className="loadbar" aria-label={`${percent}% full`}>
      <span className={`loadbar__fill loadbar__fill--${tone}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, loading, error } = useAsync(() => adminApi.stats(), []);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error.message}</Alert>;

  const { ticketsByStatus } = stats;

  return (
    <div className="stack-lg">
      <div className="stats">
        <StatTile label="Pending approval" value={ticketsByStatus.pending} to="/admin/tickets?status=pending" />
        <StatTile label="Confirmed tickets" value={ticketsByStatus.confirmed + ticketsByStatus.checked_in} />
        <StatTile label="Ticket revenue" value={formatMoney(stats.revenue)} />
        <StatTile label="On waitlists" value={stats.waitlisted} to="/admin/waitlist" />
        <StatTile label="Upcoming flights" value={stats.upcomingFlights} to="/admin/flights" />
        <StatTile label="Passengers" value={stats.passengers} />
      </div>

      <section className="card stack">
        <h2 className="h3">Ticket pipeline</h2>
        <div className="pipeline">
          {Object.entries(ticketsByStatus).map(([status, count]) => (
            <div key={status} className="pipeline__step">
              <strong>{count}</strong>
              <span className="muted">{capitalize(status)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h2 className="h3">Next departures · load factor</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Flight</th><th>Route</th><th>Departs</th><th>Booked</th><th className="w-40">Load</th></tr>
            </thead>
            <tbody>
              {stats.loadFactors.map((f) => (
                <tr key={f.id}>
                  <td className="mono">{f.flightNumber}</td>
                  <td>{f.route}</td>
                  <td>{formatDateTime(f.departureTime)}</td>
                  <td>{f.booked}/{f.capacity}</td>
                  <td><LoadBar percent={f.loadFactor} /> <span className="small muted">{f.loadFactor}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
