---
target: emulator
app: ./mobile/android/app/build/outputs/apk/debug/app-debug.apk
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
---

# Mobile Login Flow — Android Emulator
<!-- Verified against mobile/screens/LoginScreen.js, mobile/api.js, mobile/App.js
     on 2026-09-09. The mobile login is the same two-step flow as the web app:
     password + "Continue" button -> OTP + "Verify" button. Same field
     labels ("Email", "Password", "One-time passcode"), same API calls
     (challengeId-based, not email-based OTP verify). Storage uses
     AsyncStorage with the same key names ('token', 'accountId') as the
     web app's localStorage. -->

## Enter credentials (step 1 of 2)
Fill the Email field with '{{email}}'.
Fill the Password field with '{{password}}'.
Tap the Continue button.

## Enter OTP (step 2 of 2)
The screen shows "Enter the OTP sent to your registered mobile number."
Fill the One-time passcode field with '{{otp}}'.
Tap the Verify button.

## Verify dashboard
Assert the screen contains 'Welcome back'.
Assert the screen contains 'Available balance'.
Assert the "Home" tab is shown in the bottom navigation.

## Log out
<!-- Requires app-patches/PATCHES.md Patch 08 applied — the app has no
     logout control without it. Remove this step if testing against an
     unpatched build. -->
Tap the Log out button in the top-right of the header.
Assert the screen contains 'Log in'.
