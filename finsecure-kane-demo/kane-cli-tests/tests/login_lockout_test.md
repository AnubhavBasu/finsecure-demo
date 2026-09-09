---
mode: testing
variables:
  app_url:
    value: "http://localhost:5173"
---

# Login Lockout — 3 Failed Attempts (PRD §2.2, verified against backend/routes/auth.js)

> Caution: this test locks the shared demo@finsecure.com account for 30 minutes
> when it passes. Do not run this immediately before other tests that need to
> log in as demo@finsecure.com — either re-seed the database (npm run seed)
> or wait out the lockout window first.

## First failed attempt
Go to {{app_url}}/login.
Fill the email field with 'demo@finsecure.com'.
Fill the password field with 'WrongPass1'.
Click the Continue button.
Assert the POST /api/auth/login returned HTTP status 401.
Assert the page contains 'Invalid email or password'.

## Second failed attempt
Fill the email field with 'demo@finsecure.com'.
Fill the password field with 'WrongPass2'.
Click the Continue button.
Assert the POST /api/auth/login returned HTTP status 401.
Assert the page contains 'Invalid email or password'.

## Third failed attempt — triggers lockout
Fill the email field with 'demo@finsecure.com'.
Fill the password field with 'WrongPass3'.
Click the Continue button.
Assert the POST /api/auth/login returned HTTP status 423.
Assert the page contains 'Account locked for 30 minutes after 3 failed attempts.'
Assert console contains 'FS_EVENT: login_failed'.
