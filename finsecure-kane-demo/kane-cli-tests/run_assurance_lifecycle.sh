#!/bin/bash
# Kane-CLI Assurance Lifecycle — FinSecure PRD v1 → v2
# This script documents the commands. Run each step manually in a terminal
# because extract, review, and design are interactive sessions.
set -e

echo "============================================"
echo "  Kane-CLI Assurance Lifecycle Demo"
echo "  FinSecure Banking PRD v1 → v2"
echo "============================================"
echo ""

# --------------------------------------------------
# STEP 1: Ingest PRD v1
# --------------------------------------------------
echo "[Step 1] Ingesting PRD v1..."
kane-cli context ingest ./banking-prd.md --as banking-prd-v1
echo ""

# --------------------------------------------------
# STEP 2: Extract use-cases (INTERACTIVE)
# --------------------------------------------------
echo "[Step 2] Extracting use-cases from PRD v1..."
echo "  This opens an interactive chat session."
echo "  The agent will propose use-cases with citations."
echo "  Review and approve them in the session."
echo ""
echo "  Run: kane-cli context extract"
echo ""
read -p "Press Enter after completing extract..."

# --------------------------------------------------
# STEP 3: Review proposals
# --------------------------------------------------
echo "[Step 3] Reviewing proposals..."
echo "  Promote derived → trusted."
echo ""
echo "  Run: kane-cli context review"
echo ""
read -p "Press Enter after completing review..."

# --------------------------------------------------
# STEP 4: List use-cases
# --------------------------------------------------
echo "[Step 4] Listing trusted use-cases..."
kane-cli context list --type usecase
echo ""

# --------------------------------------------------
# STEP 5: Design tests (INTERACTIVE)
# --------------------------------------------------
echo "[Step 5] Designing tests for a use-case..."
echo "  Pick a use-case from the list above."
echo ""
echo "  Run: kane-cli design tests --use-case <uc-id>"
echo ""
read -p "Press Enter after completing design..."

# --------------------------------------------------
# STEP 6: Review design output
# --------------------------------------------------
echo "[Step 6] Reviewing design output..."
echo "  Run: kane-cli context review"
echo ""
read -p "Press Enter after completing design review..."

# --------------------------------------------------
# STEP 7: Author the designed tests (first run)
# --------------------------------------------------
echo "[Step 7] Authoring designed tests..."
echo "  Run kane-cli testmd run on each generated _test.md file."
echo "  Example: kane-cli testmd run .testmuai/tests/t-valid-login-with-otp_test.md --agent"
echo ""
read -p "Press Enter after authoring tests..."

# --------------------------------------------------
# STEP 8: Measure coverage
# --------------------------------------------------
echo "[Step 8] Measuring coverage..."
kane-cli cover
echo ""
echo "Gaps:"
kane-cli cover gaps --stage design
echo ""

# --------------------------------------------------
# STEP 9: Reconcile PRD v1 → v2 (INTERACTIVE)
# --------------------------------------------------
echo "[Step 9] Reconciling PRD v1 → v2..."
echo "  Key changes in v2:"
echo "    - §3.2: Step-up OTP threshold lowered from \$2,000 to \$1,000"
echo "    - §3.4: Saved-payee exemption REMOVED"
echo "    - §3.5: Notification timing specified (60s push, 5m email)"
echo ""
echo "  Run: kane-cli maintain reconcile --from ./banking-prd-v2.md --source-id banking-prd-v1"
echo ""
read -p "Press Enter after completing reconcile..."

# --------------------------------------------------
# STEP 10: Re-measure coverage
# --------------------------------------------------
echo "[Step 10] Re-measuring coverage after reconcile..."
kane-cli cover
echo ""
kane-cli cover gaps --stage all
echo ""

echo "============================================"
echo "  Assurance Lifecycle Demo Complete"
echo "============================================"
