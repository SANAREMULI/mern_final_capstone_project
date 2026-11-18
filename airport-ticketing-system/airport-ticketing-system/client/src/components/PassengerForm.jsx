import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function splitName(name = '') {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

/** Collects passenger name/email; prefilled from the logged-in account. */
export default function PassengerForm({ submitLabel, busy, onSubmit }) {
  const { user } = useAuth();
  const [passenger, setPassenger] = useState({ ...splitName(user?.name), email: user?.email || '' });

  const update = (event) => setPassenger((p) => ({ ...p, [event.target.name]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    onSubmit(passenger);
  };

  return (
    <form className="stack" onSubmit={submit}>
      <div className="form-row">
        <label className="field">
          <span>First name (as on ID)</span>
          <input name="firstName" value={passenger.firstName} onChange={update} required maxLength={50} />
        </label>
        <label className="field">
          <span>Last name</span>
          <input name="lastName" value={passenger.lastName} onChange={update} required maxLength={50} />
        </label>
      </div>
      <label className="field">
        <span>Email for e-ticket</span>
        <input type="email" name="email" value={passenger.email} onChange={update} required />
      </label>
      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? 'Please wait…' : submitLabel}
      </button>
    </form>
  );
}
