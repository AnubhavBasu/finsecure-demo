export default function PublicFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', marginTop: 64 }}>
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          color: 'var(--slate-muted)',
        }}
      >
        <span>FinSecure — demo environment</span>
        <span>Privacy · Security · Support</span>
      </div>
    </footer>
  );
}
