const express = require('express');
const pool = require('../db');
const { createChallenge, verifyChallenge } = require('../otpStore');

const router = express.Router();

const PER_TRANSACTION_LIMIT = 10000; // PRD §3.1
const STEP_UP_THRESHOLD = 1000;      // PRD v2 §3.2 (resolved threshold)

async function getAccount(id) {
  const [rows] = await pool.query('SELECT * FROM accounts WHERE id = ?', [id]);
  return rows[0] || null;
}

// ---------------------------------------------------------------------------
// POST /api/transfers — initiate a transfer (PRD §3)
// Simplification for this demo: there is only one table, so a transfer
// debits the sender's balance but does not credit a real payee account.
// Restricted-account limit is checked per-transaction, not as a rolling
// daily total (there's no transactions table to sum against) — call this
// out if a client asks about true daily aggregation.
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const { accountId, toPayee, amount } = req.body;
  const amountNum = Number(amount);

  if (!accountId || !toPayee || !amountNum || amountNum <= 0) {
    return res.status(400).json({ error: 'accountId, toPayee, and a positive amount are required' });
  }

  try {
    const account = await getAccount(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    if (amountNum > PER_TRANSACTION_LIMIT) {
      return res.status(422).json({ error: `Transfers are capped at $${PER_TRANSACTION_LIMIT} per transaction.` });
    }

    if (account.kyc_status === 'Restricted' && amountNum > Number(account.daily_transfer_limit)) {
      return res.status(422).json({
        error: `Account is Restricted pending KYC — daily transfer limit is $${account.daily_transfer_limit}.`,
      });
    }

    if (Number(account.balance) < amountNum) {
      return res.status(422).json({ error: 'Insufficient balance.' });
    }

    if (amountNum > STEP_UP_THRESHOLD) {
      const challengeId = createChallenge('transfer', { accountId: account.id, toPayee, amount: amountNum });
      return res.json({
        requiresOtp: true,
        challengeId,
        message: `Transfers above $${STEP_UP_THRESHOLD} require a step-up OTP challenge.`,
      });
    }

    const [result] = await pool.query(
      'UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?',
      [amountNum, account.id, amountNum]
    );
    if (result.affectedRows === 0) {
      return res.status(422).json({ error: 'Insufficient balance.' });
    }

    return res.json({ status: 'completed', toPayee, amount: amountNum });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Transfer failed' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/transfers/verify-otp — complete a step-up-gated transfer
// ---------------------------------------------------------------------------
router.post('/verify-otp', async (req, res) => {
  const { challengeId, otp } = req.body;
  if (!challengeId || !otp) {
    return res.status(400).json({ error: 'challengeId and otp are required' });
  }

  const result = verifyChallenge(challengeId, otp);
  if (!result.ok) {
    return res.status(401).json({ error: result.reason });
  }
  if (result.type !== 'transfer') {
    return res.status(400).json({ error: 'This challenge is not a transfer challenge' });
  }

  const { accountId, toPayee, amount } = result.payload;

  try {
    const [updateResult] = await pool.query(
      'UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?',
      [amount, accountId, amount]
    );
    if (updateResult.affectedRows === 0) {
      return res.status(422).json({ error: 'Insufficient balance at time of confirmation.' });
    }
    return res.json({ status: 'completed', toPayee, amount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Transfer confirmation failed' });
  }
});

module.exports = router;
