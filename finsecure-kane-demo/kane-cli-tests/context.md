---
name: finsecure-context
description: Kane-CLI local context for the FinSecure banking app — verified against actual source (backend/routes/*.js, web/src/pages/*.jsx) on 2026-09-09
---

# FinSecure Banking App — Test Context

## Application Overview
FinSecure is a digital banking application. Customers sign up with PAN + Aadhaar, log in via password + OTP (MFA), view their account dashboard, and initiate fund transfers with step-up OTP for amounts above $1,000.

## Test Environment
- Web URL: http://localhost:5173
- Backend API: http://localhost:4000
- Database: MySQL (finsecure_demo, single `accounts` table)
- Database resets on each `npm run seed`

## Demo Credentials
- Email: demo@finsecure.com
- Password: Passw0rd!
- OTP is always: 123456 (hardcoded in backend/otpStore.js, on purpose — deterministic automation)

## Login Flow — Verified Two-Step (web/src/pages/Login.jsx)
This is NOT a single-button login. It is two sequential forms on the same page:

1. **Password step** (default view): Email field, Password field, button labeled **"Continue"**.
   - Submits to `POST /api/auth/login` with `{ email, password }`.
   - On success, response includes `challengeId` — NOT a token yet.
   - Page switches to the OTP step.
2. **OTP step**: One field labeled "One-time passcode", button labeled **"Verify"**.
   - Submits to `POST /api/auth/verify-otp` with `{ challengeId, otp }` — NOT `{ email, otp }`.
   - On success: `localStorage.setItem('token', ...)`, `localStorage.setItem('accountId', ...)`, redirects to `/dashboard`.

There is no button literally labeled "Login" anywhere in the UI.

## Transfer Flow — Verified (web/src/pages/Transfer.jsx)
1. Form fields: "Pay to (email)" and "Amount ($)", button labeled **"Send"**.
   - Submits to `POST /api/transfers` with `{ accountId, toPayee, amount }` — NOT `fromAccountId`.
   - `accountId` comes from `localStorage.getItem('accountId')`, not user input.
2. If `amount > 1000`: response has `requiresOtp: true` + `challengeId`. Form switches to an OTP field, button labeled **"Confirm transfer"**.
   - Submits to `POST /api/transfers/verify-otp` with `{ challengeId, otp }`.
3. Success message text: `Transfer of $<amount> to <toPayee> completed.`

## Navigation / Routing (web/src/App.jsx — confirmed clean, no hash routing)
- `/` redirects to `/login`
- `/login`, `/signup`, `/dashboard`, `/transfer` — all real routes via `react-router-dom` `BrowserRouter`

## API Endpoints — Verified Request/Response Shapes
| Method | Path | Request body | Notable response fields |
|---|---|---|---|
| GET | `/api/health` | — | `{"status":"ok"}` |
| POST | `/api/auth/signup` | `{fullName, email, password, panNumber, aadhaarNumber}` | `201`, `{id, status: "Restricted", message}` |
| POST | `/api/auth/login` | `{email, password}` | `200` → `{requiresOtp: true, challengeId, message}`; `401` invalid creds; `423` locked |
| POST | `/api/auth/verify-otp` | `{challengeId, otp}` | `200` → `{token, accountId}` (token format: `demo-token-<accountId>`) |
| GET | `/api/accounts/:id` | — | `{id, full_name, email, kyc_status, balance, daily_transfer_limit, created_at}` |
| POST | `/api/transfers` | `{accountId, toPayee, amount}` | `200` → either `{status: "completed", toPayee, amount}` or `{requiresOtp: true, challengeId, message}` |
| POST | `/api/transfers/verify-otp` | `{challengeId, otp}` | `200` → `{status: "completed", toPayee, amount}` |

## Known Error Messages (exact strings from backend/routes/auth.js, transfers.js)
- Wrong password / unknown email: `"Invalid email or password"` (HTTP 401)
- Account locked: `"Account locked for 30 minutes after 3 failed attempts."` (HTTP 423)
- Already locked, retry: `"Account locked. Try again in N minute(s)."` (HTTP 423)
- Over per-transaction limit: `"Transfers are capped at $10000 per transaction."` (HTTP 422)
- Restricted account over daily limit: `"Account is Restricted pending KYC — daily transfer limit is $500."` (HTTP 422)
- Insufficient balance: `"Insufficient balance."` (HTTP 422)
- Step-up required: `"Transfers above $1000 require a step-up OTP challenge."`

## Known Business Rules (verified in backend/routes/*.js)
- OTP is always 123456, expires 5 minutes after issuance (in-memory, lost on server restart)
- New accounts start `kyc_status = 'Restricted'`, daily transfer limit $500 (PRD §1.3)
- Login locks after 3 consecutive failed attempts for 30 minutes (PRD §2.2); lockout email is only `console.log`'d, not sent
- Step-up OTP required for transfers above $1,000, all payees, no exceptions (PRD v2 §3.2 — the resolved rule, not the v1 draft contradiction)
- Per-transaction limit: $10,000 (PRD §3.1)
- Restricted daily limit is checked per-transaction, NOT as a true rolling daily total (no transactions table exists)

## Instrumentation Added by App Patches (see app-patches/PATCHES.md)
- `session_id` httpOnly cookie set on successful OTP verify (Patch 01)
- `user_prefs` localStorage key added alongside existing `token`/`accountId` (Patch 02)
- `console.log('FS_EVENT: login_success', ...)`, `console.error('FS_EVENT: login_failed', ...)`, `console.log('FS_EVENT: transfer_initiated'/'transfer_completed', ...)`, `console.error('FS_EVENT: transfer_failed', ...)` (Patch 03)
- `document.title` set per page: "Login — FinSecure", "Sign Up — FinSecure", "Dashboard — FinSecure", "Transfer — FinSecure" (Patch 04)
- Submit buttons `disabled` until required fields are filled; `aria-label` added (Patch 05)
- URL routing patch (originally planned Patch 06) was **cancelled** — routing was already clean
- CORS updated to explicit origin + `credentials: true`, frontend `fetch()` calls updated to `credentials: 'include'` — required for the `session_id` cookie to survive the cross-origin (5173 → 4000) request

## Mobile App — Verified (mobile/screens/*.js, mobile/api.js, mobile/App.js, mobile/components/*.js)

The Expo/React Native app mirrors the web app closely — same screens, same
field labels, same two-step login, same `challengeId`-based API calls
(`mobile/api.js` is functionally identical to `web/src/api.js`, just with a
platform-aware host: `10.0.2.2` for the Android emulator, `localhost` for
iOS simulator).

**Navigation** (React Navigation stack, `mobile/App.js`): screen names are
`Login`, `SignUp`, `Dashboard`, `Transfer`. Login and SignUp render with
`headerShown: false`; Dashboard and Transfer show a header plus a bottom
tab bar (`BottomNav.js`) with items "Home" (→ Dashboard) and "Transfer",
plus two inert items ("Cards", "Statements").

**Login screen**: same as web — "Email" / "Password" fields, **"Continue"**
button, then "One-time passcode" field, **"Verify"** button. Storage uses
`AsyncStorage` (React Native's equivalent of localStorage) with the same
key names as web: `token`, `accountId`.

**Sign-up screen**: "Full name" / "Email" / "Password" / "PAN number" /
"Aadhaar number" fields, **"Create account"** button. No OTP step — same
as web, shows a success message and navigates back to Login after 1.5s.

**Dashboard screen**: greeting "Welcome back, `<first name>`.", "Available
balance" panel, KYC status pill, "Send money" / "Statements" tiles.

**Transfer screen**: "Send money" title, "Pay to (email)" / "Amount ($)"
fields, **"Send"** button. Above $1,000: "Step-up verification required."
banner, "One-time passcode" field, **"Confirm transfer"** button. Same
completion message as web: `Transfer of $<amount> to <toPayee> completed.`

**Gap found and patched — no disabled-button logic on mobile.** Unlike the
web app (after Patch 05), `mobile/components/Button.js` only disabled
itself while `loading` was true (mid-request) — it had no concept of
"disabled until required fields are filled," and neither `LoginScreen.js`
nor `TransferScreen.js` passed a `disabled` prop to it. Fixed by Patch 07
(`app-patches/PATCHES.md`): `Button.js` now accepts a `disabled` prop,
Login and Transfer pass field-validity booleans. Until Patch 07 is applied
to your working copy, don't write a mobile test asserting the Continue/Send
button is disabled before typing — it'll fail against the unpatched app.

**Gap found and patched — no logout mechanism anywhere.** Confirmed by
reading `App.js`, `DashboardScreen.js`, `TransferScreen.js`, and
`BottomNav.js` directly (checked twice, byte-identical both times, file
listing unchanged) — no button, no header action, no other screen
implements it. Fixed by Patch 08: a shared "Log out" control added to
`App.js`'s `Stack.Navigator` header, visible on Dashboard and Transfer
(mirrors web's `AppShell` logout scope), clears `AsyncStorage` and resets
navigation to Login. Until Patch 08 is applied, there's no way to log out
of the mobile app short of clearing app storage manually or force-quitting.

**Uncertain — DevTools-style checkpoints on mobile.** Kane-CLI's mobile
testing docs (kane-cli-mobile.md) describe objectives as screen text and
control assertions only ("Objectives are written the same way... describes
app screens and controls"). Nothing in the docs confirms Network, Console,
Cookies, or localStorage/AsyncStorage checkpoints work against a mobile
app the way they do against a browser page. Treat mobile checkpoints as
Visual-only (`assert the screen contains ...`) until confirmed otherwise —
don't write a mobile test asserting on AsyncStorage or console output
without checking the docs or a real run first. Patches 09 and 10 add
`user_prefs` to AsyncStorage and `FS_EVENT` console logs on mobile anyway,
for parity with web — but whether Kane-CLI can actually check either one
on a mobile run is unconfirmed until tried.

**Build config**: app name "FinSecure Demo", Android package
`com.finsecuredemo.app`, iOS bundle id `com.finsecuredemo.app`
(`mobile/app.json`).

## Still Not Verified Against Source
- `web/src/components/PublicHeader.jsx`, `PublicFooter.jsx` — not pulled, assumed cosmetic only (header/footer chrome on the public login/signup pages).
- `backend/db.js`, `backend/schema.sql` — not pulled; the `accounts` table column list is only known from the README's `DESCRIBE accounts` summary, not the actual schema file.
- `mobile/package.json`, `mobile/app.json`'s edit history shows two commits titled "Error Fixed" after the initial commit — the nature of that fix hasn't been investigated. If a mobile build fails in a way that looks environment-related, check those commits' diffs before assuming it's a local setup issue.
