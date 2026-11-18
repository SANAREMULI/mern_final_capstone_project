import { useState } from 'react';

const swap = (form) => ({ ...form, origin: form.destination, destination: form.origin });

/** Flight search form. Calls onSearch with { origin, destination, date, seatClass, sort }. */
export default function SearchBar({ airports, initial, onSearch }) {
  const [form, setForm] = useState(initial);

  const update = (event) => setForm((f) => ({ ...f, [event.target.name]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    onSearch(form);
  };

  const airportOptions = airports.map((a) => (
    <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
  ));

  return (
    <form className="search card" onSubmit={submit} aria-label="Search flights">
      <label className="field">
        <span>From</span>
        <select name="origin" value={form.origin} onChange={update}>
          <option value="">Any airport</option>
          {airportOptions}
        </select>
      </label>

      <button
        type="button"
        className="search__swap"
        onClick={() => setForm(swap)}
        aria-label="Swap origin and destination"
      >
        ⇄
      </button>

      <label className="field">
        <span>To</span>
        <select name="destination" value={form.destination} onChange={update}>
          <option value="">Any airport</option>
          {airportOptions}
        </select>
      </label>

      <label className="field">
        <span>Date</span>
        <input type="date" name="date" value={form.date} onChange={update} />
      </label>

      <label className="field">
        <span>Cabin</span>
        <select name="seatClass" value={form.seatClass} onChange={update}>
          <option value="">Any</option>
          <option value="economy">Economy</option>
          <option value="business">Business</option>
        </select>
      </label>

      <label className="field">
        <span>Sort</span>
        <select name="sort" value={form.sort} onChange={update}>
          <option value="departure">Earliest</option>
          <option value="price">Cheapest</option>
        </select>
      </label>

      <button type="submit" className="btn btn--primary search__submit">Search</button>
    </form>
  );
}
