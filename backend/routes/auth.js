const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { createChallenge, verifyChallenge } = require('../otpStore');

const router = express.Router();

const MAX_FAILED_ATTEMPTS = 3;      // PRD §2.2
const LOCKOUT_MINUTES = 30;         // PRD §2.2
const RESTRICTED_DAILY_LIMIT = 500; // PRD §1.3

// ---------------------------------------------------------------------------
// POST /api/auth/signup  — Account opening / KYC (PRD §1)
// New accounts start Restricted with a $500 daily limit until manually
// verified. This demo auto-verifies nothing — kyc_status stays Restricted.
// ---------------------------------------------------------------------------
router.post('/signup', async (req, res) => {
  const { fullName, email, password, panNumber, aadhaarNumber } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'fullName, email, and password are required' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM accounts WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO accounts
         (full_name, email, password_hash, pan_number, aadhaar_number,
          kyc_status, daily_transfer_limit)
       VALUES (?, ?, ?, ?, ?, 'Restricted', ?)`,
      [fullName, email, passwordHash, panNumber || null, aadhaarNumber || null, RESTRICTED_DAILY_LIMIT]
    );

    return res.status(201).json({
      id: result.insertId,
      status: 'Restricted',
      message: 'Account created. KYC review pending — daily transfer limit is $500 until verified.',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Signup failed' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login — step 1: password check (PRD §2.1, §2.2)
// On success, issues an OTP challenge rather than a session.
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM accounts WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const account = rows[0];

    if (account.locked_until && new Date(account.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(account.locked_until) - new Date()) / 60000);
      return res.status(423).json({ error: `Account locked. Try again in ${minutesLeft} minute(s).` });
    }

    const passwordOk = await bcrypt.compare(password, account.password_hash);

    if (!passwordOk) {
      const attempts = account.failed_login_attempts + 1;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
        await pool.query(
          'UPDATE accounts SET failed_login_attempts = 0, locked_until = ? WHERE id = ?',
          [lockedUntil, account.id]
        );
        // PRD §2.2 also requires an email notification on lockout — out of
        // scope for this demo backend (no email provider wired up); logged
        // instead so the behavior is visible.
        console.log(`[demo] would email ${account.email}: your account is locked for 30 minutes`);
        return res.status(423).json({ error: 'Account locked for 30 minutes after 3 failed attempts.' });
      }
      await pool.query('UPDATE accounts SET failed_login_attempts = ? WHERE id = ?', [attempts, account.id]);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await pool.query(
      'UPDATE accounts SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      [account.id]
    );

    const challengeId = createChallenge('login', { accountId: account.id });
    return res.json({
      requiresOtp: true,
      challengeId,
      message: 'Password verified. Enter the OTP sent to your registered mobile number.',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/verify-otp — step 2: complete MFA login (PRD §2.1)
// ---------------------------------------------------------------------------
router.post('/verify-otp', (req, res) => {
  const { challengeId, otp } = req.body;
  if (!challengeId || !otp) {
    return res.status(400).json({ error: 'challengeId and otp are required' });
  }

  const result = verifyChallenge(challengeId, otp);
  if (!result.ok) {
    return res.status(401).json({ error: result.reason });
  }
  if (result.type !== 'login') {
    return res.status(400).json({ error: 'This challenge is not a login challenge' });
  }

  // Demo-only "session": a token that just encodes the account id.
  // Not a real auth token — do not reuse this pattern outside a demo.
  const token = `demo-token-${result.payload.accountId}`;
  return res.json({ token, accountId: result.payload.accountId });
});

module.exports = router;
