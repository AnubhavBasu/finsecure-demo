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

# Mobile Fund Transfer Flow — Android Emulator
<!-- Verified against mobile/screens/TransferScreen.js on 2026-09-09.
     Same field labels, button labels, and step-up-OTP behavior as the web
     Transfer.jsx: "Pay to (email)" / "Amount ($)" / "Send", then on
     amounts over $1,000 a "Confirm transfer" button appears. -->

## Log in
Fill the Email field with '{{email}}'.
Fill the Password field with '{{password}}'.
Tap the Continue button.
Fill the One-time passcode field with '{{otp}}'.
Tap the Verify button.
Assert the screen contains 'Welcome back'.

## Navigate to transfer
Tap the "Transfer" tab in the bottom navigation.
Assert the screen contains 'Send money'.

## Submit a small transfer — no step-up OTP (amount <= $1000)
Fill the "Pay to (email)" field with 'payee-small@finsecure.com'.
Fill the "Amount ($)" field with '500'.
Tap the Send button.
Assert the screen contains 'completed'.

## Submit a large transfer — triggers step-up OTP (amount > $1000)
Fill the "Pay to (email)" field with 'payee-large@finsecure.com'.
Fill the "Amount ($)" field with '1500'.
Tap the Send button.
Assert the screen contains 'Step-up verification required'.
Fill the One-time passcode field with '{{otp}}'.
Tap the "Confirm transfer" button.
Assert the screen contains 'completed'.
