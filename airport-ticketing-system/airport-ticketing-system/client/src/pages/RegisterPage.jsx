import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Feedback';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (event) => setForm((f) => ({ ...f, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth container">
      <form className="card stack auth__card" onSubmit={submit}>
        <h1 className="h2">Create your account</h1>
        <Alert>{error}</Alert>
        <label className="field">
          <span>Full name</span>
          <input name="name" autoComplete="name" value={form.name} onChange={update} required maxLength={80} />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" autoComplete="email" value={form.email} onChange={update} required />
        </label>
        <label className="field">
          <span>Password (min. 8 characters)</span>
          <input type="password" name="password" autoComplete="new-password" minLength={8} value={form.password} onChange={update} required />
        </label>
        <label className="field">
          <span>Confirm password</span>
          <input type="password" name="confirm" autoComplete="new-password" minLength={8} value={form.confirm} onChange={update} required />
        </label>
        <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Creating account…' : 'Sign up'}</button>
        <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
