import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Overview', to: '/dashboard', real: true },
  { label: 'Send money', to: '/transfer', real: true },
  { label: 'Statements', to: '#', real: false },
  { label: 'Cards', to: '#', real: false },
  { label: 'Support', to: '#', real: false },
];

export default function AppShell({ accountName, children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 220,
          background: 'var(--ink)',
          color: 'rgba(255,255,255,0.85)',
          padding: '24px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: '#fff', padding: '0 24px 28px' }}>
          FinSecure
        </div>
        <nav className="stack">
          {NAV_ITEMS.map((item) => {
            const active = item.real && location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={item.real ? undefined : (e) => e.preventDefault()}
                style={{
                  padding: '11px 24px',
                  fontSize: 14,
                  color: active ? '#fff' : item.real ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)',
                  background: active ? 'var(--ink-panel)' : 'transparent',
                  borderLeft: active ? '3px solid var(--brass)' : '3px solid transparent',
                  cursor: item.real ? 'pointer' : 'default',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: 64,
            borderBottom: '1px solid var(--line)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 16,
            padding: '0 32px',
            flexShrink: 0,
          }}
        >
          {accountName && <span style={{ fontSize: 14 }}>{accountName}</span>}
          <button onClick={logout} className="btn btn-ghost" style={{ padding: '7px 14px' }}>
            Log out
          </button>
        </header>
        <main style={{ flex: 1, padding: 40, maxWidth: 720 }}>{children}</main>
      </div>
    </div>
  );
}
