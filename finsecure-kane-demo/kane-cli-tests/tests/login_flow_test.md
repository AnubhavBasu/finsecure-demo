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

# Login Flow — MFA with OTP (verified against web/src/pages/Login.jsx)

## Navigate to login page
Go to {{app_url}}/login.
Assert the page title contains 'Login'.
Assert the Continue button is disabled.

## Enter credentials (step 1 of 2)
Fill the email field with '{{email}}'.
Fill the password field with '{{password}}'.
Assert the Continue button is enabled.
Click the Continue button.

## Verify API response for step 1
Assert the POST /api/auth/login returned HTTP status 200.
Assert no console errors on the page.

## Enter OTP (step 2 of 2)
Assert the page contains 'One-time passcode' or 'Enter the OTP'.
Fill the one-time passcode field with '{{otp}}'.
Click the Verify button.

## Verify API response for step 2
Assert the POST /api/auth/verify-otp returned HTTP status 200.

## Verify successful login and redirect
Assert URL contains /dashboard.
Assert page title contains 'Dashboard'.
Assert the page contains 'Overview'.
Assert a cookie named 'session_id' exists.
Assert the session_id cookie is httpOnly.
Assert the token key exists in localStorage.
Assert the accountId key exists in localStorage.
Assert the user_prefs key exists in localStorage.
Assert console contains 'FS_EVENT: login_success'.
Store the account balance as 'balance'.
Store the KYC status shown on the page as 'kyc_status'.
