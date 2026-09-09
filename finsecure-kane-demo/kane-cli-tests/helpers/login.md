Go to {{app_url}}/login.
Assert page title contains 'Login'.
Fill the email field with '{{email}}'.
Fill the password field with '{{password}}'.
Click the Continue button.
Assert the page contains 'One-time passcode' or 'Enter the OTP'.
Fill the one-time passcode field with '{{otp}}'.
Click the Verify button.
Assert URL contains /dashboard.
