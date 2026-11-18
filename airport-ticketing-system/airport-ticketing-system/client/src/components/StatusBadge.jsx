import { capitalize } from '../utils/format';

const TONES = {
  pending: 'warn',
  confirmed: 'ok',
  checked_in: 'info',
  cancelled: 'muted',
  rejected: 'danger',
  scheduled: 'ok',
  delayed: 'warn',
  boarding: 'info',
  departed: 'muted',
  waiting: 'warn',
  promoted: 'ok',
  left: 'muted',
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge--${TONES[status] || 'muted'}`}>{capitalize(status)}</span>;
}
