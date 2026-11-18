import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSavedFlights } from '../context/SavedFlightsContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { flights } = useSavedFlights();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const close = () => setOpen(false);
  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand__mark" aria-hidden="true">✈</span> SkyGate
        </Link>

        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>

        <nav className={`navbar__links ${open ? 'is-open' : ''}`} onClick={close}>
          <NavLink to="/" end>Flights</NavLink>
          {user && (
            <>
              <NavLink to="/trips">My trips</NavLink>
              <NavLink to="/saved">
                Saved {flights.length > 0 && <span className="pill">{flights.length}</span>}
              </NavLink>
            </>
          )}
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          {user ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
              Log out
            </button>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link to="/register" className="btn btn--primary btn--sm">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
