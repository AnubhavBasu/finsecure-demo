#!/bin/bash
# Kane-CLI Parallel Execution — FinSecure Demo
# Runs multiple independent tests concurrently and aggregates results.
set -o pipefail

RESULTS_DIR=$(mktemp -d)
APP_URL="http://localhost:5173"
COMMON_FLAGS="--agent --headless --timeout 120"

echo "Starting parallel Kane-CLI tests..."
echo "Results dir: $RESULTS_DIR"
echo ""

# Test 1: Login flow (two-step: password -> Continue -> OTP -> Verify)
kane-cli run \
  "go to $APP_URL/login, fill the email field with 'demo@finsecure.com', fill the password field with 'Passw0rd!', click the Continue button, fill the one-time passcode field with '123456', click the Verify button, assert URL contains /dashboard" \
  --url "$APP_URL" $COMMON_FLAGS \
  > "$RESULTS_DIR/login.ndjson" 2>"$RESULTS_DIR/login.log" &

# Test 2: Signup flow (no OTP step — creates a Restricted account, redirects to /login)
kane-cli run \
  "go to $APP_URL/signup, fill the full name field with 'Parallel User', fill the email field with 'parallel$(date +%s)@test.com', fill the password field with 'Test1234!', fill the PAN number field with 'ZZZZZ9999Z', fill the Aadhaar number field with '999999999999', click the Create account button, assert the page contains 'Account created'" \
  --url "$APP_URL" $COMMON_FLAGS \
  > "$RESULTS_DIR/signup.ndjson" 2>"$RESULTS_DIR/signup.log" &

# Test 3: API health smoke
kane-cli run \
  "go to $APP_URL, then call GET http://localhost:4000/api/health, save the response as h, assert {{h.status}} is 200" \
  --url "$APP_URL" $COMMON_FLAGS \
  > "$RESULTS_DIR/health.ndjson" 2>"$RESULTS_DIR/health.log" &

# Wait for all background jobs
wait

# Aggregate results
echo ""
echo "============================================"
echo "  Kane-CLI Parallel Test Results"
echo "  $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "============================================"
echo ""
echo "| # | Test   | Status  | Duration | Summary |"
echo "|---|--------|---------|----------|---------|"

PASS=0
FAIL=0
i=1

for f in "$RESULTS_DIR"/*.ndjson; do
  test_name=$(basename "$f" .ndjson)
  result=$(tail -1 "$f" 2>/dev/null)

  if [ -z "$result" ]; then
    echo "| $i | $test_name | ERROR | - | No output |"
    ((FAIL++))
  else
    status=$(echo "$result" | jq -r '.status // "error"')
    duration=$(echo "$result" | jq -r '.duration // "-"')
    summary=$(echo "$result" | jq -r '.one_liner // "No summary"')

    if [ "$status" = "passed" ]; then
      ((PASS++))
    else
      ((FAIL++))
    fi

    echo "| $i | $test_name | $status | ${duration}s | $summary |"
  fi
  ((i++))
done

TOTAL=$((PASS + FAIL))
echo ""
echo "Pass rate: $PASS/$TOTAL ($(( PASS * 100 / TOTAL ))%)"

# Cleanup
rm -rf "$RESULTS_DIR"

# Exit with failure if any test failed
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
