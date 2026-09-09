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

# All Checkpoint Types — Single Flow (verified against real source, 2026-09-09)

## Navigate and check DOM state (Textual checkpoint)
Go to {{app_url}}/login.
Assert the Continue button is disabled.

## Fill form and check title (Title checkpoint)
Fill the email field with '{{email}}'.
Fill the password field with '{{password}}'.
Assert page title contains 'Login'.
Assert the Continue button is enabled.

## Submit login step 1 and check network (Network checkpoint)
Click the Continue button.
Assert the POST /api/auth/login returned HTTP status 200.

## Enter OTP (Action) — step 2 of login
Assert the page contains 'One-time passcode' or 'Enter the OTP'.
Fill the one-time passcode field with '{{otp}}'.
Click the Verify button.
Assert the POST /api/auth/verify-otp returned HTTP status 200.

## Check URL after redirect (URL checkpoint)
Assert URL contains /dashboard.

## Check page content (Visual checkpoint)
Assert the page contains 'Overview'.
Store the account balance as 'balance'.

## Check console logs (Console checkpoint)
Assert console contains 'FS_EVENT: login_success'.
Assert no uncaught JavaScript exceptions.

## Check cookies (Cookies checkpoint)
Assert a cookie named 'session_id' exists.
Assert the session_id cookie is httpOnly.

## Check localStorage (localStorage checkpoint)
Assert the token key exists in localStorage.
Assert the user_prefs key exists in localStorage.

## Check performance (Performance checkpoint)
```yaml
optional: true
```
Assert page LCP is under 2500ms.
