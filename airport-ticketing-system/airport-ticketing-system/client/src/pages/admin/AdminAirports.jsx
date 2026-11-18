import { useState } from 'react';
import { airportApi } from '../../api';
import useAsync from '../../hooks/useAsync';
import { Alert, Spinner } from '../../components/Feedback';

const EMPTY = { code: '', name: '', city: '', country: '' };

export default function AdminAirports() {
  const { data: airports, loading, reload } = useAsync(() => airportApi.list(), []);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const update = (event) => setForm((f) => ({ ...f, [event.target.name]: event.target.value }));

  const create = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await airportApi.create(form);
      setForm(EMPTY);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (airport) => {
    if (!window.confirm(`Delete ${airport.code}?`)) return;
    setError('');
    try {
      await airportApi.remove(airport._id);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <form className="card form-grid" onSubmit={create}>
        <label className="field"><span>IATA code</span><input name="code" value={form.code} onChange={update} maxLength={3} required /></label>
        <label className="field"><span>Name</span><input name="name" value={form.name} onChange={update} required /></label>
        <label className="field"><span>City</span><input name="city" value={form.city} onChange={update} required /></label>
        <label className="field"><span>Country</span><input name="country" value={form.country} onChange={update} required /></label>
        <button type="submit" className="btn btn--primary">Add airport</button>
      </form>

      <Alert onClose={() => setError('')}>{error}</Alert>
      {loading && !airports && <Spinner />}

      {airports && (
        <div className="table-wrap card">
          <table className="table">
            <thead><tr><th>Code</th><th>Name</th><th>City</th><th>Country</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {airports.map((a) => (
                <tr key={a._id}>
                  <td className="mono">{a.code}</td>
                  <td>{a.name}</td>
                  <td>{a.city}</td>
                  <td>{a.country}</td>
                  <td><button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(a)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
