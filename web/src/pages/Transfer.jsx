import { useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { api } from '../api.js';

export default function Transfer() {
  const accountId = localStorage.getItem('accountId');
  const [toPayee, setToPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [challengeId, setChallengeId] = useState(null);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const submitTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    console.log('FS_EVENT: transfer_initiated', { toPayee, amount: Number(amount) });
    try {
      const result = await api.transfer({ accountId, toPayee, amount: Number(amount) });
      if (result.requiresOtp) {
        setChallengeId(result.challengeId);
        setMessage(result.message);
      } else {
        console.log('FS_EVENT: transfer_completed', { toPayee: result.toPayee, amount: result.amount });
        setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      }
    } catch (err) {
      console.error('FS_EVENT: transfer_failed', { toPayee, amount, reason: err.message });
      setError(err.message);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await api.verifyTransferOtp({ challengeId, otp });
      setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      setChallengeId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AppShell>
      <h1>Send money</h1>
      <p className="muted">Transfers above $1,000 require a step-up OTP challenge.</p>

      <div className="panel panel-accent" style={{ marginTop: 24, maxWidth: 420 }}>
        {!challengeId && (
          <form onSubmit={submitTransfer}>
            <div className="field">
              <label>Pay to (email)</label>
              <input required value={toPayee} onChange={(e) => setToPayee(e.target.value)} />
            </div>
            <div className="field">
              <label>Amount ($)</label>
              <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Send</button>
          </form>
        )}
        {challengeId && (
          <form onSubmit={submitOtp}>
            <div className="message message-hint">Step-up verification required. (Demo OTP: 123456)</div>
            <div className="field">
              <label>One-time passcode</label>
              <input required value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
                        <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={!toPayee || !amount || Number(amount) <= 0}
              aria-label="Submit fund transfer">
              Send
            </button>
          </form>
        )}
        {message && <div className="message message-success" style={{ marginTop: 16 }}>{message}</div>}
        {error && <div className="message message-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </AppShell>
  );
}
