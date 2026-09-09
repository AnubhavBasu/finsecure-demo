const express = require('express');
const pool = require('../db');

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/accounts/:id — profile, balance, KYC status (PRD §1, §4)
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, kyc_status, balance, daily_transfer_limit, created_at
       FROM accounts WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch account' });
  }
});

module.exports = router;
