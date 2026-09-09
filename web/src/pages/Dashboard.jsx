import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { api } from '../api.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const accountId = localStorage.getItem('accountId');
    if (!accountId) {
      navigate('/login');
      return;
    }
    api.getAccount(accountId).then(setAccount).catch((err) => setError(err.message));
  }, [navigate]);

  if (error) {
    return (
      <AppShell>
        <div className="message message-error">{error}</div>
      </AppShell>
    );
  }
  if (!account) {
    return (
      <AppShell>
        <p className="muted">Loading…</p>
      </AppShell>
    );
  }

  const statusTone = account.kyc_status === 'Verified' ? 'message-success' : 'message-hint';

  return (
    <AppShell accountName={account.full_name}>
      <h1>Overview</h1>
      <p className="muted">Welcome back, {account.full_name.split(' ')[0]}.</p>

      <div className="panel panel-accent" style={{ marginTop: 24, marginBottom: 24 }}>
        <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>Available balance</div>
        <div className="mono" style={{ fontSize: 40, fontWeight: 500, color: 'var(--ink)' }}>
          ${Number(account.balance).toLocaleString()}
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className={`message ${statusTone}`} style={{ marginBottom: 0, padding: '4px 10px', fontSize: 13 }}>
            {account.kyc_status}
          </span>
          <span className="muted" style={{ fontSize: 13 }}>
            Daily transfer limit: ${Number(account.daily_transfer_limit).toLocaleString()}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Link to="/transfer" className="panel" style={{ display: 'block' }}>
          <h3>Send money</h3>
          <p className="muted" style={{ marginBottom: 0, fontSize: 14 }}>
            Transfer to a registered payee. Step-up verification applies above $1,000.
          </p>
        </Link>
        <div className="panel" style={{ opacity: 0.55, cursor: 'default' }}>
          <h3>Statements</h3>
          <p className="muted" style={{ marginBottom: 0, fontSize: 14 }}>Not available in this demo.</p>
        </div>
      </div>
    </AppShell>
  );
}
