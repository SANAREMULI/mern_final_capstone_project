import { waitlistApi } from '../../api';
import useAsync from '../../hooks/useAsync';
import { Alert, EmptyState, Spinner } from '../../components/Feedback';
import { capitalize, formatDateTime } from '../../utils/format';

export default function AdminWaitlist() {
  const { data, loading, error } = useAsync(() => waitlistApi.all({ status: 'waiting' }), []);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error.message}</Alert>;
  if (data.length === 0) {
    return (
      <EmptyState title="Nobody is waiting">
        Passengers join a waitlist when a cabin sells out. They are ticketed automatically, first come first served,
        whenever a booking in that cabin is cancelled or rejected.
      </EmptyState>
    );
  }

  return (
    <div className="table-wrap card">
      <table className="table">
        <thead>
          <tr><th>#</th><th>Passenger</th><th>Flight</th><th>Cabin</th><th>Joined</th></tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry._id}>
              <td><strong>{entry.position}</strong></td>
              <td>
                {entry.passenger.firstName} {entry.passenger.lastName}
                <div className="small muted">{entry.user?.email}</div>
              </td>
              <td>
                {entry.flight?.flightNumber} · {entry.flight?.origin?.code}→{entry.flight?.destination?.code}
                <div className="small muted">{entry.flight && formatDateTime(entry.flight.departureTime)}</div>
              </td>
              <td>{capitalize(entry.seatClass)}</td>
              <td className="small">{formatDateTime(entry.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
