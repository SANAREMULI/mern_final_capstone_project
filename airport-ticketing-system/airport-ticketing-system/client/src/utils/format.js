const timeFormat = new Intl.DateTimeFormat('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false });
const dateFormat = new Intl.DateTimeFormat('en-KE', { weekday: 'short', day: 'numeric', month: 'short' });
const dateTimeFormat = new Intl.DateTimeFormat('en-KE', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
});
const moneyFormat = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });

export const formatTime = (value) => timeFormat.format(new Date(value));
export const formatDate = (value) => dateFormat.format(new Date(value));
export const formatDateTime = (value) => dateTimeFormat.format(new Date(value));
export const formatMoney = (amount) => moneyFormat.format(amount ?? 0);

export function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Start and end of a local calendar day ("YYYY-MM-DD") as ISO strings. */
export function localDayRange(isoDate) {
  if (!isoDate) return {};
  const [y, mo, d] = isoDate.split('-').map(Number);
  const start = new Date(y, mo - 1, d);
  const end = new Date(y, mo - 1, d + 1);
  return { departAfter: start.toISOString(), departBefore: end.toISOString() };
}

/** Value for <input type="datetime-local"> from a Date/ISO string, in local time. */
export function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const capitalize = (text = '') => text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, ' ');
