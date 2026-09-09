---
target: simulator
app: ./mobile/ios/build/FinSecure.zip
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

# Mobile Login Flow — iOS Simulator
<!-- Verified against mobile/screens/LoginScreen.js, mobile/api.js, mobile/App.js
     on 2026-09-09. Same source as the Android version — Expo/React Native
     screens are shared across both platforms, no iOS-specific branching
     in LoginScreen.js. -->

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
