---
mode: testing
variables:
  email:
    value: "demo@finsecure.com"
  password:
    value: "Passw0rd!"
    secret: true
  otp:
    value: "123456"
    secret: true
  app_url:
    value: "http://localhost:5173"
---

# Fund Transfer Flow — Step-Up OTP (verified against web/src/pages/Transfer.jsx)

## Login
@import ../helpers/login.md

## Navigate to transfer page
Click the "Send money" link.
Assert URL contains /transfer.
Assert page title contains 'Transfer'.

## Submit a small transfer — no step-up OTP required (amount <= $1000)
Fill the "Pay to (email)" field with 'payee-small@finsecure.com'.
Fill the "Amount ($)" field with '500'.
Click the Send button.
Assert the POST /api/transfers returned HTTP status 200.
Assert the page contains 'completed'.
Assert no uncaught JavaScript exceptions.
Assert console contains 'FS_EVENT: transfer_completed'.

## Submit a large transfer — triggers step-up OTP (amount > $1000, per PRD v2 §3.2)
Fill the "Pay to (email)" field with 'payee-large@finsecure.com'.
Fill the "Amount ($)" field with '1500'.
Click the Send button.
Assert the page contains 'Step-up verification required'.
Assert console contains 'FS_EVENT: transfer_initiated'.
Fill the one-time passcode field with '{{otp}}'.
Click the "Confirm transfer" button.
Assert the POST /api/transfers/verify-otp returned HTTP status 200.
Assert the page contains 'completed'.
