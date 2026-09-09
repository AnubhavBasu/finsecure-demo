# FinSecure — Kane-CLI End-to-End Demo

> Run every Kane-CLI feature against a working banking app (web + mobile).
> PRD v1 → v2 requirement drift is used to demonstrate the full assurance lifecycle.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| MySQL Community | 8.x | `mysql --version` |
| Kane CLI | latest | `kane-cli --version` |
| Chrome | latest | `google-chrome --version` |
| Xcode | 16+ (iOS sim) | `xcodebuild -version` |
| Android Studio | latest (Android emu) | `emulator -list-avds` |
| jq | any | `jq --version` |

---

## Phase 0 — Environment Setup

### 0.1 Install Kane CLI

```bash
npm install -g @testmuai/kane-cli
```

### 0.2 Authenticate

```bash
kane-cli login --username "anubhavb" --access-key "<YOUR_LT_ACCESS_KEY>"
kane-cli whoami
```

### 0.3 Clone and Start the App

```bash
git clone https://github.com/AnubhavBasu/finsecure-demo.git
cd finsecure-demo

# Database
mysql -u root -p < backend/schema.sql

# Backend (terminal 1)
cd backend
npm install
cp .env.example .env          # edit DB_USER / DB_PASSWORD
npm run seed                   # creates demo@finsecure.com / Passw0rd!
npm run dev                    # http://localhost:4000

# Web app (terminal 2)
cd web
npm install
npm run dev                    # http://localhost:5173
```

Confirm backend: `curl http://localhost:4000/api/health` → `{"status":"ok"}`

### 0.4 Apply App Patches (Required for Full Checkpoint Coverage)

`app-patches/PATCHES.md` has the exact before/after code for each item below,
verified against the real source. Apply by hand — these are diffs in one
markdown file, not standalone `.patch` files.

| Patch | What It Adds | Kane-CLI Feature It Unlocks |
|-------|--------------|-----------------------------|
| 01 — Session cookie + CORS | `Set-Cookie: session_id` (httpOnly, sameSite=strict) on OTP verify; CORS updated to explicit origin + credentials so the browser keeps the cookie across the 5173→4000 origin boundary | DevTools: Cookies |
| 02 — localStorage `user_prefs` | Adds a `user_prefs` JSON key alongside the `token`/`accountId` keys the app already stores | DevTools: localStorage |
| 03 — Console instrumentation | `console.log('FS_EVENT: login_success' / 'transfer_completed' / ...)`, `console.error('FS_EVENT: login_failed' / 'transfer_failed', ...)` on real success/failure paths | DevTools: Console |
| 04 — Page titles | `document.title` per route ("Login — FinSecure", "Dashboard — FinSecure", "Transfer — FinSecure", "Sign Up — FinSecure") | Title Checkpoint |
| 05 — DOM states | `disabled` on the Continue/Send buttons until required fields are filled, `aria-label` added | Textual (DOM) Checkpoint |

Patch 06 (URL routing) was planned but **cancelled** — `web/src/App.jsx`
already uses clean `react-router-dom` routes with no hash routing.

### 0.5 Set Up Kane-CLI Variables

```bash
# Copy the variables file into place
mkdir -p .testmuai/variables
cp kane-cli-tests/variables/credentials.json .testmuai/variables/
```

### 0.6 Set Up Kane-CLI Context

```bash
# Copy context files into place
cp kane-cli-tests/context.md .testmuai/context.md
```

---

## Phase 1 — One-Shot CLI Runs (`kane-cli run`)

Each command demonstrates a different Kane-CLI feature. All button labels,
field labels, and API shapes below are verified against the actual source
(web/src/pages/Login.jsx, Transfer.jsx, backend/routes/*.js) — the real
login is two sequential steps on one page: password + "Continue" button,
then OTP + "Verify" button. There is no button literally labeled "Login".

### 1.1 Action + Visual Assertion

```bash
kane-cli run \
  --url http://localhost:5173/login \
  --variables-file .testmuai/variables/credentials.json \
  "fill the email field with '{{email}}',
   fill the password field with '{{password}}',
   click the Continue button,
   assert the page contains 'One-time passcode',
   fill the one-time passcode field with '{{otp}}',
   click the Verify button,
   assert the page contains 'Overview'"
```

**Demonstrates:** Actions, visual assertions, variables.

### 1.2 Extraction (`store as`)

```bash
kane-cli run \
  --url http://localhost:5173/login \
  --variables-file .testmuai/variables/credentials.json \
  "fill the email field with '{{email}}',
   fill the password field with '{{password}}',
   click the Continue button,
   fill the one-time passcode field with '{{otp}}',
   click the Verify button,
   store the account balance as 'balance',
   store the KYC status shown on the page as 'kyc_status',
   assert the balance is greater than 0"
```

**Demonstrates:** Extraction with `store as`, assertion operators (`greater than`).

### 1.3 URL Checkpoint

```bash
kane-cli run \
  --url http://localhost:5173/login \
  --variables-file .testmuai/variables/credentials.json \
  "fill the email field with '{{email}}',
   fill the password field with '{{password}}',
   click the Continue button,
   fill the one-time passcode field with '{{otp}}',
   click the Verify button,
   assert URL contains /dashboard"
```

**Demonstrates:** URL assertion.

### 1.4 Title Checkpoint

Requires app-patches Patch 04 (page titles) applied — otherwise `<title>` never changes on client-side navigation.

```bash
kane-cli run \
  --url http://localhost:5173/login \
  --variables-file .testmuai/variables/credentials.json \
  "fill the email field with '{{email}}',
   fill the password field with '{{password}}',
   click the Continue button,
   fill the one-time passcode field with '{{otp}}',
   click the Verify button,
   assert page title contains 'Dashboard'"
```

**Demonstrates:** Title assertion.

### 1.5 Textual (DOM) Checkpoint

Requires app-patches Patch 05 (disabled state on the Continue button) applied.

```bash
kane-cli run \
  --url http://localhost:5173/login \
  "assert the Continue button is disabled,
   fill the email field with 'test@example.com',
   fill the password field with 'password',
   assert the Continue button is enabled"
```

**Demonstrates:** DOM state assertions (disabled/enabled).

### 1.6 DevTools: Network Checkpoint

```bash
kane-cli run \
  --url http://localhost:5173/login \
  --variables-file .testmuai/variables/credentials.json \
  "fill the email field with '{{email}}',
   fill the password field with '{{password}}',
   click the Continue button,
   assert the POST /api/auth/login returned HTTP status 200"
```

**Demonstrates:** Network traffic assertion.

### 1.7 DevTools: Console Checkpoint

Requires app-patches Patch 03 (console instrumentation) applied.

```bash
kane-cli run \
  --url http://localhost:5173/login \
  --variables-file .testmuai/variables/credentials.json \
  "fill the email field with '{{email}}',
   fill the password field with '{{password}}',
   click the Continue button,
   fill the one-time passcode field with '{{otp}}',
   click the Verify button,
   assert console contains 'FS_EVENT: login_success',
   assert no uncaught JavaScript exceptions"
```

**Demonstrates:** Console log assertion, exception check.

### 1.8 DevTools: Cookies Checkpoint

Requires app-patches Patch 01 (session cookie + CORS credentials) applied.

```bash
kane-cli run \
  --url http://localhost:5173/login \
  --variables-file .testmuai/variables/credentials.json \
  "fill the email field with '{{email}}',
   fill the password field with '{{password}}',
   click the Continue button,
   fill the one-time passcode field with '{{otp}}',
   click the Verify button,
   assert a cookie named 'session_id' exists,
   assert the session_id cookie is httpOnly"
```

**Demonstrates:** Cookie existence and attribute assertions.

### 1.9 DevTools: localStorage Checkpoint

The app already stores `token` and `accountId` in localStorage on login
(verified in Login.jsx) — Patch 02 adds `user_prefs` on top of that.

```bash
kane-cli run \
  --url http://localhost:5173/login \
  --variables-file .testmuai/variables/credentials.json \
  "fill the email field with '{{email}}',
   fill the password field with '{{password}}',
   click the Continue button,
   fill the one-time passcode field with '{{otp}}',
   click the Verify button,
   assert the token key exists in localStorage,
   assert the 'theme' field in the user_prefs localStorage item is 'light'"
```

**Demonstrates:** localStorage key existence and JSON value drilling.

### 1.10 DevTools: Performance Checkpoint

```bash
kane-cli run \
  --url http://localhost:5173/login \
  --variables-file .testmuai/variables/credentials.json \
  "fill the email field with '{{email}}',
   fill the password field with '{{password}}',
   click the Continue button,
   fill the one-time passcode field with '{{otp}}',
   click the Verify button,
   assert page LCP is under 2500ms,
   assert FCP is less than 1800ms"
```

**Demonstrates:** Core Web Vitals assertion.

### 1.11 If/Else Branching

The app has no single screen offering a Login/Sign-Up choice (`/` always
redirects to `/login`), so this branches on real disabled-state behavior
instead of an invented UI.

```bash
kane-cli run \
  --url http://localhost:5173/login \
  --variables-file .testmuai/variables/credentials.json \
  "fill the email field with '{{email}}',
   fill the password field with '{{password}}',
   if the Continue button is enabled then click it, else assert an error message is visible"
```

**Demonstrates:** Conditional checkpoint logic.

### 1.12 Negative Path — Login Lockout

Locks the shared demo account for 30 minutes on success — re-seed
(`npm run seed`) or wait it out before running other login-dependent tests.

```bash
kane-cli run \
  --url http://localhost:5173/login \
  "fill the email field with 'demo@finsecure.com',
   fill the password field with 'WrongPassword',
   click the Continue button,
   assert the page contains 'Invalid email or password',
   fill the email field with 'demo@finsecure.com',
   fill the password field with 'WrongPassword',
   click the Continue button,
   assert the page contains 'Invalid email or password',
   fill the email field with 'demo@finsecure.com',
   fill the password field with 'WrongPassword',
   click the Continue button,
   assert the page contains 'locked'"
```

**Demonstrates:** Negative path testing, error state visual assertion.

### 1.13 API Testing — Health Smoke

```bash
kane-cli run \
  --url http://localhost:5173 \
  "go to http://localhost:5173,
   then call GET http://localhost:4000/api/health,
   save the response as h,
   assert {{h.status}} is 200,
   assert {{h.response_body.status}} is 'ok'"
```

**Demonstrates:** API smoke test with status and body assertions.

### 1.14 API Testing — Auth Token Chaining

The real login API is two calls: `POST /api/auth/login` returns a
`challengeId` (not a token), which must be passed — together with the OTP —
to `POST /api/auth/verify-otp` to get the actual token. There is no `email`
field in the verify-otp request body.

```bash
kane-cli run \
  --url http://localhost:5173 \
  "go to http://localhost:5173,
   then send a POST request to http://localhost:4000/api/auth/login with JSON body {\"email\":\"demo@finsecure.com\",\"password\":\"Passw0rd!\"},
   confirm the response status is 200 and the challengeId is non-empty,
   then send a POST request to http://localhost:4000/api/auth/verify-otp with JSON body containing that challengeId and otp '123456',
   confirm the response status is 200 and the token is non-empty"
```

**Demonstrates:** Multi-step API chaining with a value extracted from the first response.

### 1.15 Agent Mode (NDJSON Output)

```bash
kane-cli run \
  --url http://localhost:5173/login \
  --variables-file .testmuai/variables/credentials.json \
  --agent --headless \
  "fill the email field with '{{email}}',
   fill the password field with '{{password}}',
   click the Continue button,
   fill the one-time passcode field with '{{otp}}',
   click the Verify button,
   assert the page contains 'Overview'" \
  2>/dev/null | tail -1 | jq .
```

**Demonstrates:** Agent mode, NDJSON parsing, `run_end` event extraction.

---

## Phase 2 — Interactive TUI (`kane-cli --tui`)

### 2.1 Multi-Run Session (State Persists)

```bash
kane-cli --tui
```

In the TUI, type these objectives sequentially:

```
> go to http://localhost:5173/login, fill the email field with 'demo@finsecure.com', fill the password field with 'Passw0rd!', click the Continue button

> fill the one-time passcode field with '123456', click the Verify button, assert the page contains 'Overview'

> click the "Send money" link, fill the "Pay to (email)" field with 'savings@finsecure.com', fill the "Amount ($)" field with '500', click the Send button, assert the page contains 'completed'
```

**Demonstrates:** Multi-run sessions sharing browser state, no re-authentication between runs.

### 2.2 Slash Commands

```
/config show
/balance
/whoami
/help
/exit
```

**Demonstrates:** TUI slash commands, configuration, credit balance.

---

## Phase 3 — Persistent Test Files (`testmd`)

### 3.1 Run a Test File

```bash
kane-cli testmd run kane-cli-tests/tests/login_flow_test.md --agent
```

First run: agent authors each step, caches recordings.
Subsequent runs: replays from cache (no LLM cost).

### 3.2 Run with @import Helpers

```bash
kane-cli testmd run kane-cli-tests/tests/transfer_flow_test.md --agent
```

**Demonstrates:** `@import` for reusable login helper, replay caching, cascade rule.

### 3.3 Record a Test from Live Session

Signup has no OTP step — it creates a Restricted account and shows a
success message before redirecting to `/login` after ~1.5s.

```bash
kane-cli run \
  --url http://localhost:5173/signup \
  --name signup-flow \
  "fill the full name field with 'Test User',
   fill the email field with 'newuser@finsecure.com',
   fill the password field with 'NewPassw0rd!',
   fill the PAN number field with 'ABCDE1234F',
   fill the Aadhaar number field with '123456789012',
   click the Create account button,
   assert the page contains 'Account created'"
```

Saves to `.testmuai/tests/signup-flow_test.md`. Then re-run:

```bash
kane-cli testmd run .testmuai/tests/signup-flow_test.md --agent
```

**Demonstrates:** `--name` flag, recording from live session, re-running.

---

## Phase 4 — AI Test Generation (`generate`)

### 4.1 Generate from Description

```bash
kane-cli generate "login flow for a banking app with MFA via OTP, including lockout after 3 failed attempts" \
  --scenario-limit 5 \
  --per-scenario-limit 3
```

Note the request ID printed (e.g., `23271`).

### 4.2 Refine

```bash
kane-cli generate "also cover biometric fallback and OTP expiry edge cases" \
  --refine --req <REQ_ID>
```

### 4.3 Save as Runnable Tests

```bash
kane-cli generate --save --req <REQ_ID>
```

Writes `_test.md` files to `.testmuai/tests/`.

### 4.4 Generate from PRD File

```bash
kane-cli generate "test the fund transfer flow described in the attached spec" \
  --files ./banking-prd-v2.md \
  --scenario-limit 5
```

**Demonstrates:** File attachment, AI generation, refine, save, run loop.

---

## Phase 5 — Assurance Lifecycle (PRD v1 → v2 Drift)

This is the crown jewel. We use both PRDs to demonstrate the full requirement-to-test-to-coverage loop.

### 5.1 Ingest PRD v1

```bash
kane-cli context ingest ./banking-prd.md --as banking-prd-v1
```

### 5.2 Extract Use-Cases from v1

```bash
kane-cli context extract
```

Interactive chat: the agent proposes use-cases with citations. Review and approve them.

### 5.3 Review Proposals

```bash
kane-cli context review
```

Promote proposals from `derived` → `trusted`.

### 5.4 Design Tests for a Use-Case

```bash
kane-cli context list --type usecase
kane-cli design tests --use-case uc-login-and-authentication
```

Interactive session: the engine produces ACs, scenarios, and runnable `_test.md` files.

### 5.5 Review the Design Output

```bash
kane-cli context review
```

Approve the generated ACs, scenarios, and tests.

### 5.6 Author the Designed Tests (First Run)

```bash
kane-cli testmd run .testmuai/tests/t-valid-login-with-otp_test.md --agent
```

### 5.7 Measure Coverage

```bash
kane-cli cover
kane-cli cover gaps --stage design
```

**Demonstrates:** Proven vs owed coverage, gap worklist.

### 5.8 Reconcile PRD v1 → v2 (Requirement Drift)

```bash
kane-cli maintain reconcile \
  --from ./banking-prd-v2.md \
  --source-id banking-prd-v1
```

The key change: PRD v2 lowers the step-up OTP threshold from $2,000 to $1,000 and removes the saved-payee exemption. The reconcile session surfaces:

- **MODIFY** on the transfer use-case (threshold changed)
- **ARCHIVE** on the saved-payee exemption (§3.4 removed)

### 5.9 Re-Measure Coverage After Reconcile

```bash
kane-cli cover
kane-cli cover gaps --stage all
```

**Demonstrates:** Full assurance lifecycle: ingest → extract → review → design → execute → cover → maintain.

---

## Phase 6 — Parallel Execution

```bash
bash kane-cli-tests/run_parallel.sh
```

Runs the login flow, the signup flow, and an API health smoke test
concurrently, then prints a pass/fail table. See
`kane-cli-tests/run_parallel.sh` for the exact objectives — verified
against the real "Continue"/"Verify" login and "Create account" signup
button labels, not "Login"/"Sign Up".

**Demonstrates:** Shell background parallel execution, result aggregation.

---

## Phase 7 — Mobile Testing

The mobile app (Expo/React Native) mirrors the web app closely — verified
against `mobile/screens/*.js`: same two-step login (Email/Password →
**Continue** → One-time passcode → **Verify**), same field and button
labels as web, same `challengeId`-based API calls. App name is
"FinSecure Demo" (`mobile/app.json`).

### 7.1 Doctor Check

```bash
kane-cli doctor --install
kane-cli doctor --targets
```

### 7.2 Android Emulator

```bash
cd mobile
npm install
npx expo run:android       # build the APK

kane-cli run \
  --target emulator \
  --app ./android/app/build/outputs/apk/debug/app-debug.apk \
  "fill the Email field with 'demo@finsecure.com', fill the Password field with 'Passw0rd!', tap the Continue button, fill the One-time passcode field with '123456', tap the Verify button, assert the screen contains 'Welcome back'"
```

### 7.3 iOS Simulator

```bash
npx expo run:ios           # build the .app (outputs .zip)

kane-cli run \
  --target simulator \
  --app ./ios/build/FinSecure.zip \
  "fill the Email field with 'demo@finsecure.com', fill the Password field with 'Passw0rd!', tap the Continue button, fill the One-time passcode field with '123456', tap the Verify button, assert the screen contains 'Welcome back'"
```

### 7.4 Mobile testmd Files

```bash
kane-cli testmd run kane-cli-tests/tests/mobile_login_test.md --agent
kane-cli testmd run kane-cli-tests/tests/mobile_login_ios_test.md --agent
kane-cli testmd run kane-cli-tests/tests/mobile_transfer_test.md --agent
```

**Demonstrates:** Mobile testing on both platforms, `--target` flag, `_test.md` with mobile frontmatter.

**Known gap, not a Kane-CLI limitation:** the mobile app has no
disabled-until-valid button state today (unlike the web app after Patch 05)
— see `app-patches/PATCHES.md` Patch 07 if you want that behavior for a
mobile DOM-state-style demo. Also unconfirmed: whether Kane-CLI's mobile
automation reads Network/Console/AsyncStorage checkpoints the way it reads
browser DevTools checkpoints — the mobile test files here stick to Visual
checkpoints (`assert the screen contains ...`) for that reason.

---

## Phase 8 — Evidence Packs

### 8.1 View Evidence

```bash
kane-cli evidence serve
```

Opens the hosted viewer for the latest run's evidence pack.

### 8.2 Validate Evidence

```bash
kane-cli evidence validate ~/.testmuai/kaneai/sessions/<session-id>/evidence/<execution_id>.evidence
```

### 8.3 Merge Evidence Packs

```bash
kane-cli evidence merge \
  ~/.testmuai/kaneai/sessions/<session-1>/evidence/*.evidence \
  ~/.testmuai/kaneai/sessions/<session-2>/evidence/*.evidence \
  --output ./merged.evidence
```

**Demonstrates:** Evidence viewing, validation, merging.

---

## Phase 9 — Code Export

```bash
kane-cli testmd run kane-cli-tests/tests/login_flow_test.md \
  --agent --code-export --code-language python
```

Generates Playwright Python code in `output-login_flow/playwright-python-code/`.

```bash
kane-cli testmd run kane-cli-tests/tests/login_flow_test.md \
  --agent --code-export --code-language javascript
```

Generates Playwright JavaScript code.

**Demonstrates:** Code export in both languages.

---

## Phase 10 — CI/CD (GitHub Actions)

Push the `.github/workflows/kane-cli-tests.yml` workflow (included in this repo). It runs:

1. Installs Node.js, Chrome, Kane CLI
2. Starts the backend + web app
3. Runs the login test in headless agent mode
4. Uploads evidence as build artifacts

**Demonstrates:** Full CI/CD integration with GitHub Actions.

---

## Phase 11 — Configuration

```bash
kane-cli config show
kane-cli config set-window 1280x800
kane-cli config set-mode testing
kane-cli config project               # interactive picker
kane-cli config folder                 # interactive picker
kane-cli config chrome-profile         # interactive picker
```

**Demonstrates:** All config subcommands.

---

## Phase 12 — Skills Installation

```bash
npx @testmuai/kane-cli-skill
```

Or manually for Claude Code:

```bash
mkdir -p ~/.claude/skills/kane-cli
curl -o ~/.claude/skills/kane-cli/SKILL.md \
  https://raw.githubusercontent.com/LambdaTest/kane-cli/main/skill-installer/skills/SKILL.md
```

**Demonstrates:** AI agent skill installation.

---

## Kane-CLI Feature Coverage Matrix

| # | Feature | Phase | Command |
|---|---------|-------|---------|
| 1 | Install | 0 | `npm install -g @testmuai/kane-cli` |
| 2 | Authentication (basic) | 0 | `kane-cli login --username --access-key` |
| 3 | Configuration | 11 | `kane-cli config show / set-*` |
| 4 | One-shot CLI run | 1 | `kane-cli run "..."` |
| 5 | Visual checkpoint | 1.1 | `assert the page contains '...'` |
| 6 | Textual (DOM) checkpoint | 1.5 | `assert the submit button is disabled` |
| 7 | URL checkpoint | 1.3 | `assert URL contains /dashboard` |
| 8 | Title checkpoint | 1.4 | `assert page title contains 'Dashboard'` |
| 9 | DevTools: Network | 1.6 | `assert the POST ... returned HTTP status 200` |
| 10 | DevTools: Console | 1.7 | `assert console contains 'FS_EVENT: ...'` |
| 11 | DevTools: Cookies | 1.8 | `assert session_id cookie is httpOnly` |
| 12 | DevTools: localStorage | 1.9 | `assert the token key exists in localStorage` |
| 13 | DevTools: Performance | 1.10 | `assert page LCP is under 2500ms` |
| 14 | If/Else branching | 1.11 | `if ... then ... else ...` |
| 15 | Extraction (store as) | 1.2 | `store the balance as 'balance'` |
| 16 | Variables & secrets | 1.1 | `--variables-file`, `{{email}}` |
| 17 | Context files | 0.6 | `.testmuai/context.md` |
| 18 | Agent mode (NDJSON) | 1.15 | `--agent --headless` |
| 19 | Interactive TUI | 2 | `kane-cli --tui` |
| 20 | Multi-run sessions | 2.1 | Sequential objectives in TUI |
| 21 | testmd (persistent tests) | 3.1 | `kane-cli testmd run` |
| 22 | @import helpers | 3.2 | `@import ./helpers/login.md` |
| 23 | Replay/cache | 3.1 | Second run of same test |
| 24 | Record from live session | 3.3 | `kane-cli run --name` |
| 25 | AI generation | 4.1 | `kane-cli generate` |
| 26 | Refine | 4.2 | `--refine --req` |
| 27 | Save generated tests | 4.3 | `--save --req` |
| 28 | Generate with files | 4.4 | `--files ./banking-prd-v2.md` |
| 29 | Assurance: ingest | 5.1 | `kane-cli context ingest` |
| 30 | Assurance: extract | 5.2 | `kane-cli context extract` |
| 31 | Assurance: review | 5.3 | `kane-cli context review` |
| 32 | Assurance: design tests | 5.4 | `kane-cli design tests` |
| 33 | Assurance: coverage | 5.7 | `kane-cli cover` |
| 34 | Assurance: maintain/reconcile | 5.8 | `kane-cli maintain reconcile` |
| 35 | Parallel execution | 6 | Shell background `&` + `wait` |
| 36 | Mobile: Android emulator | 7.2 | `--target emulator --app` |
| 37 | Mobile: iOS simulator | 7.3 | `--target simulator --app` |
| 38 | Evidence: serve | 8.1 | `kane-cli evidence serve` |
| 39 | Evidence: validate | 8.2 | `kane-cli evidence validate` |
| 40 | Evidence: merge | 8.3 | `kane-cli evidence merge` |
| 41 | Code export | 9 | `--code-export --code-language` |
| 42 | CI/CD (GitHub Actions) | 10 | `.github/workflows/` |
| 43 | Skills | 12 | `npx @testmuai/kane-cli-skill` |
| 44 | Negative path testing | 1.12 | Login lockout assertion |
| 45 | API testing | 1.13–1.14 | Smoke, auth-token chaining |
