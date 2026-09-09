import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = ['Personal', 'Business', 'Cards', 'Support'];

export default function PublicHeader() {
  const location = useLocation();
  const onSignUp = location.pathname === '/signup';

  return (
    <header
      style={{
        background: 'var(--ink)',
        color: '#fff',
        padding: '0 32px',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>
            FinSecure
          </span>
          <nav style={{ display: 'flex', gap: 24 }}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" className="btn btn-ghost" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
            Log in
          </Link>
          {!onSignUp && (
            <Link to="/signup" className="btn btn-brass">
              Open an account
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
