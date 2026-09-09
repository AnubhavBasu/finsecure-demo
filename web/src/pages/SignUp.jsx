import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader.jsx';
import PublicFooter from '../components/PublicFooter.jsx';
import { api } from '../api.js';

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', panNumber: '', aadhaarNumber: '',
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const result = await api.signup(form);
      setMessage(result.message);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PublicHeader />
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '64px 32px',
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: 64,
          alignItems: 'start',
        }}
      >
        <div style={{ paddingTop: 24 }}>
          <h1>Open an account in minutes.</h1>
          <p className="muted">
            New accounts start under review — you'll have a $500 daily transfer limit
            until KYC verification clears, then full access unlocks automatically.
          </p>
        </div>

        <div className="panel panel-accent">
          <h2>Account details</h2>
          <form onSubmit={submit}>
            <div className="field">
              <label>Full name</label>
              <input required value={form.fullName} onChange={update('fullName')} />
            </div>
            <div className="field">
              <label>Email</label>
              <input required type="email" value={form.email} onChange={update('email')} />
            </div>
            <div className="field">
              <label>Password</label>
              <input required type="password" value={form.password} onChange={update('password')} />
            </div>
            <div className="field">
              <label>PAN number</label>
              <input value={form.panNumber} onChange={update('panNumber')} />
            </div>
            <div className="field">
              <label>Aadhaar number</label>
              <input value={form.aadhaarNumber} onChange={update('aadhaarNumber')} />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Create account</button>
          </form>
          {message && <div className="message message-success" style={{ marginTop: 16 }}>{message}</div>}
          {error && <div className="message message-error" style={{ marginTop: 16 }}>{error}</div>}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
