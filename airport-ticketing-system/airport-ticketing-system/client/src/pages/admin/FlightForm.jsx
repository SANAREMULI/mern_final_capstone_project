import { useState } from 'react';
import { toDateTimeInput } from '../../utils/format';

const STATUSES = ['scheduled', 'delayed', 'boarding', 'departed', 'cancelled'];

function toForm(flight) {
  return {
    flightNumber: flight?.flightNumber || '',
    airline: flight?.airline || '',
    origin: flight?.origin?._id || '',
    destination: flight?.destination?._id || '',
    departureTime: toDateTimeInput(flight?.departureTime),
    arrivalTime: toDateTimeInput(flight?.arrivalTime),
    aircraft: flight?.aircraft || 'Embraer E190',
    gate: flight?.gate || 'TBA',
    status: flight?.status || 'scheduled',
    rows: flight?.rows ?? 20,
    seatsPerRow: flight?.seatsPerRow ?? 4,
    businessRows: flight?.businessRows ?? 3,
    economyPrice: flight?.price?.economy ?? '',
    businessPrice: flight?.price?.business ?? '',
  };
}

function toPayload(form) {
  return {
    flightNumber: form.flightNumber.trim(),
    airline: form.airline.trim(),
    origin: form.origin,
    destination: form.destination,
    departureTime: new Date(form.departureTime).toISOString(),
    arrivalTime: new Date(form.arrivalTime).toISOString(),
    aircraft: form.aircraft,
    gate: form.gate,
    status: form.status,
    rows: Number(form.rows),
    seatsPerRow: Number(form.seatsPerRow),
    businessRows: Number(form.businessRows),
    price: { economy: Number(form.economyPrice), business: Number(form.businessPrice) },
  };
}

export default function FlightForm({ flight, airports, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toForm(flight));
  const [busy, setBusy] = useState(false);

  const update = (event) => setForm((f) => ({ ...f, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onSubmit(toPayload(form));
    } finally {
      setBusy(false);
    }
  };

  const airportSelect = (name, label) => (
    <label className="field">
      <span>{label}</span>
      <select name={name} value={form[name]} onChange={update} required>
        <option value="">Select…</option>
        {airports.map((a) => <option key={a._id} value={a._id}>{a.city} ({a.code})</option>)}
      </select>
    </label>
  );

  return (
    <form className="card form-grid" onSubmit={submit}>
      <h2 className="h3 form-grid__full">{flight ? `Edit ${flight.flightNumber}` : 'New flight'}</h2>
      <label className="field"><span>Flight number</span><input name="flightNumber" value={form.flightNumber} onChange={update} placeholder="KQ600" required /></label>
      <label className="field"><span>Airline</span><input name="airline" value={form.airline} onChange={update} required /></label>
      {airportSelect('origin', 'From')}
      {airportSelect('destination', 'To')}
      <label className="field"><span>Departure</span><input type="datetime-local" name="departureTime" value={form.departureTime} onChange={update} required /></label>
      <label className="field"><span>Arrival</span><input type="datetime-local" name="arrivalTime" value={form.arrivalTime} onChange={update} required /></label>
      <label className="field"><span>Aircraft</span><input name="aircraft" value={form.aircraft} onChange={update} /></label>
      <label className="field"><span>Gate</span><input name="gate" value={form.gate} onChange={update} /></label>
      <label className="field"><span>Rows</span><input type="number" min="1" max="80" name="rows" value={form.rows} onChange={update} required /></label>
      <label className="field"><span>Seats per row</span><input type="number" min="2" max="10" name="seatsPerRow" value={form.seatsPerRow} onChange={update} required /></label>
      <label className="field"><span>Business rows</span><input type="number" min="0" name="businessRows" value={form.businessRows} onChange={update} required /></label>
      <label className="field">
        <span>Status</span>
        <select name="status" value={form.status} onChange={update}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="field"><span>Economy fare (KES)</span><input type="number" min="0" name="economyPrice" value={form.economyPrice} onChange={update} required /></label>
      <label className="field"><span>Business fare (KES)</span><input type="number" min="0" name="businessPrice" value={form.businessPrice} onChange={update} required /></label>

      {form.status === 'cancelled' && flight?.status !== 'cancelled' && (
        <p className="note form-grid__full">⚠ Cancelling a flight cancels every active ticket and clears its waitlist.</p>
      )}

      <div className="row-gap form-grid__full">
        <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save flight'}</button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
