# FinSecure — Demo Banking Stack

A working banking demo built from `banking-prd.md` / `banking-prd-v2.md`, for use as the system under test in the kane-cli assurance demo.

**Stack:** Node.js + Express backend, MySQL Community Edition (one table), a Vite + React web app, and an Expo (React Native) mobile app.

## What's implemented

| PRD flow | Where |
|---|---|
| §1 Account opening / KYC | Sign-up screen (web + mobile) → `POST /api/auth/signup` |
| §2 Login & MFA, lockout | Login screen (web + mobile) → `POST /api/auth/login`, `POST /api/auth/verify-otp` |
| §3 Fund transfers, step-up OTP | Transfer screen (web + mobile) → `POST /api/transfers`, `POST /api/transfers/verify-otp` |

## Demo conveniences (read this before you present)

- **OTP is always `123456`.** No SMS/email provider is wired up — this is deliberate, so kane-cli's automated tests can drive the flow deterministically. Real OTP delivery is out of scope for a demo.
- **One table, one behavior simplification.** Everything lives in a single `accounts` table, per the brief. A transfer debits the sender's balance but does not credit a real payee row — there's no second account to credit. The Restricted daily limit is checked per-transaction, not as a true rolling daily total, since there's no transactions table to sum against. Say so if a client asks.
- **Business rule implemented:** step-up OTP is required above **$1,000** for every transfer, regardless of payee (the PRD v2 / resolved rule) — not the v1 draft's contradiction between §3.2 and §3.4. If you want the literal v1 contradiction reproduced as an actual bug for the demo, that's a different, smaller change — ask before assuming it's wanted.
- **Login lockout email (§2.2)** is logged to the backend console, not actually sent — no email provider is configured.

## 1. Database

Install MySQL Community Edition locally, then:

```bash
mysql -u root -p < backend/schema.sql
```

This creates the `finsecure_demo` database and the single `accounts` table. No rows are seeded yet.

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # edit DB_USER / DB_PASSWORD if not using root with no password
npm run seed               # creates demo@finsecure.com / Passw0rd! with a real bcrypt hash
npm run dev                 # starts on http://localhost:4000
```

Confirm it's up: `curl http://localhost:4000/api/health` → `{"status":"ok"}`

## 3. Web app

```bash
cd web
npm install
npm run dev                 # starts on http://localhost:5173
```

## 4. Mobile app (Expo)

```bash
cd mobile
npm install
npm run start                # opens the Expo dev tools; press "a" for Android, "i" for iOS
```

Android emulators reach the backend via `10.0.2.2` (already handled in `mobile/api.js`). If you're testing on a **physical phone**, edit `mobile/api.js` and replace `localhost` with your computer's LAN IP — a phone can't resolve your laptop's `localhost`.

## The single table

```sql
DESCRIBE accounts;
```

Columns: `id, full_name, email, password_hash, pan_number, aadhaar_number, kyc_status, balance, daily_transfer_limit, failed_login_attempts, locked_until, created_at`.

## The APIs

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Open an account (KYC, PRD §1) |
| POST | `/api/auth/login` | Password check, step 1 of MFA (PRD §2) |
| POST | `/api/auth/verify-otp` | OTP check, step 2 of MFA login |
| GET  | `/api/accounts/:id` | Balance, KYC status, profile |
| POST | `/api/transfers` | Initiate a transfer (PRD §3); may require step-up OTP |
| POST | `/api/transfers/verify-otp` | Complete a step-up-gated transfer |

## Not done / explicitly out of scope

- No real SMS/email OTP delivery.
- No payee/beneficiary table — transfers debit only, no second account credited.
- No statements/PDF download (PRD §4) — not requested as a functional flow.
- No push notifications (PRD §3.5, §4.2).
- No automated test suite bundled here — that's what the kane-cli assurance demo itself produces, pointed at this running app.
