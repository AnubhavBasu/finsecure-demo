# FinSecure Digital Banking — Product Requirements Document
**Version:** 2.0
**Last updated:** September 2026
**Owner:** Digital Channels Product Team

## 1. Account Opening & KYC

1.1. New customers may open a savings account through the mobile app by submitting a PAN, an Aadhaar number, and a live selfie for identity verification.

1.2. Applications with a KYC confidence score below 80 are routed to manual review, to be completed within 24 hours of submission.

1.3. Until KYC verification is complete, the account remains in **Restricted** status. A Restricted account has a maximum outward transfer limit of $500 per day, across all transfer types.

1.4. A Restricted account is automatically upgraded to **Verified** status once manual review is approved, with no further customer action required.

## 2. Login & Authentication

2.1. All customer logins require multi-factor authentication: a password plus a one-time passcode (OTP) delivered to the customer's registered mobile number.

2.2. After 3 consecutive failed login attempts, the account is locked for 30 minutes, and the customer is notified by email of the lockout.

2.3. Biometric login (fingerprint or face ID) may be enabled as a password replacement on supported devices. OTP verification is still required for the first login on any new, previously unrecognized device, regardless of biometric enrollment.

2.4. A locked account may not be unlocked early by any customer-initiated action; the 30-minute cooldown is fixed.

## 3. Fund Transfers & Payments

3.1. Customers may transfer funds to any registered payee, up to a per-transaction limit of $10,000.

3.2. **Revised (September 2026):** Transfers above $1,000 require secondary approval via a step-up OTP challenge, sent to the customer's registered mobile number, before the transfer is submitted for processing. This requirement applies to all transfers regardless of payee verification status, including previously saved and verified payees.

3.3. A transfer that fails the step-up OTP challenge three times is cancelled, and the customer must re-initiate the transfer from the beginning.

3.4. **Removed (September 2026):** The prior exemption for instant processing of payments to saved, verified payees has been withdrawn. All transfers above the threshold in 3.2 require step-up verification without exception.

3.5. The system must notify the customer of any suspicious transaction activity via push notification within 60 seconds of detection, and via email within 5 minutes.

## 4. Statements & Notifications

4.1. Customers may download account statements covering up to 7 years of history, in PDF format, from within the mobile app.

4.2. A push notification is sent to the customer's registered device for every transaction above $100.
