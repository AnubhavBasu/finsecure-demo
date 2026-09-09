// Seeds one demo user with a real bcrypt hash. Run once, after `npm install`:
//   npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const DEMO_EMAIL = 'demo@finsecure.com';
const DEMO_PASSWORD = 'Passw0rd!';

async function seed() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [existing] = await pool.query(
    'SELECT id FROM accounts WHERE email = ?',
    [DEMO_EMAIL]
  );

  if (existing.length > 0) {
    console.log(`Demo user already exists (id=${existing[0].id}). Nothing to do.`);
    process.exit(0);
  }

  const [result] = await pool.query(
    `INSERT INTO accounts
       (full_name, email, password_hash, kyc_status, balance, daily_transfer_limit)
     VALUES (?, ?, ?, 'Verified', 25000.00, 10000.00)`,
    ['Demo User', DEMO_EMAIL, passwordHash]
  );

  console.log(`Seeded demo user id=${result.insertId}`);
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
