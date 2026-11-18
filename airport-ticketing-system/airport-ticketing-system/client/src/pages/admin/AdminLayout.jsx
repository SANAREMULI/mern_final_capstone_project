import { NavLink, Outlet } from 'react-router-dom';

const LINKS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/tickets', label: 'Tickets' },
  { to: '/admin/flights', label: 'Flights' },
  { to: '/admin/waitlist', label: 'Waitlist' },
  { to: '/admin/airports', label: 'Airports' },
];

export default function AdminLayout() {
  return (
    <div className="container section">
      <nav className="tabs" aria-label="Admin sections">
        {LINKS.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end} className="tabs__link">{label}</NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
