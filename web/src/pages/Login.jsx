import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader.jsx';
import PublicFooter from '../components/PublicFooter.jsx';
import { api } from '../api.js';

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState(null);
  const [error, setError] = useState(null);

  const submitPassword = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await api.login({ email, password });
      setChallengeId(result.challengeId);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await api.verifyLoginOtp({ challengeId, otp });
      localStorage.setItem('token', result.token);
      localStorage.setItem('accountId', result.accountId);
      navigate('/dashboard');
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
          <h1>Banking that gets out of your way.</h1>
          <p className="muted">
            Move money, check your balance, and manage your account from one place —
            with step-up verification on anything that matters.
          </p>
        </div>

        <div className="panel panel-accent">
          <h2>Log in</h2>
          {step === 'password' && (
            <form onSubmit={submitPassword}>
              <div className="field">
                <label>Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label>Password</label>
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Continue</button>
            </form>
          )}
          {step === 'otp' && (
            <form onSubmit={submitOtp}>
              <div className="message message-hint">
                Enter the OTP sent to your registered mobile number. (Demo OTP: 123456)
              </div>
              <div className="field">
                <label>One-time passcode</label>
                <input required value={otp} onChange={(e) => setOtp(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Verify</button>
            </form>
          )}
          {error && <div className="message message-error">{error}</div>}
          <p style={{ marginTop: 20, marginBottom: 0, fontSize: 13 }} className="muted">
            Demo login: demo@finsecure.com / Passw0rd!
          </p>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
