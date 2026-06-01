#!/bin/bash
# End-to-end test: generate workshops for all 6 Clinovyr target industries.
set -u

cd "$(dirname "$0")"
mkdir -p output

INDUSTRIES=("Medical" "Real Estate" "Legal" "Construction" "Wellness" "Retail")
PASS=0
FAIL=0

for industry in "${INDUSTRIES[@]}"; do
  echo "Testing: $industry..."

  if ! npx ts-node generate-workshop.ts \
    --industry "$industry" \
    --company "Test Company" \
    --audience "business owners" \
    --duration 90; then
    echo "✗ $industry FAILED — generator exited with error"
    FAIL=$((FAIL + 1))
    sleep 3
    continue
  fi

  # slugify("Test Company") => test-company; baseName => test-company-YYYY-MM-DD-workshop
  PPTX=$(ls output/test-company-*-workshop.pptx 2>/dev/null | tail -1)
  GUIDE=$(ls output/test-company-*-workshop-guide.md 2>/dev/null | tail -1)

  if [ -n "${PPTX:-}" ] && [ -f "$PPTX" ] && [ -n "${GUIDE:-}" ] && [ -f "$GUIDE" ]; then
    PPTX_SIZE=$(wc -c < "$PPTX" | tr -d ' ')
    GUIDE_SIZE=$(wc -c < "$GUIDE" | tr -d ' ')
    if [ "$PPTX_SIZE" -gt 10000 ] && [ "$GUIDE_SIZE" -gt 2000 ]; then
      echo "✓ $industry passed (PPTX: ${PPTX_SIZE}b, Guide: ${GUIDE_SIZE}b)"
      PASS=$((PASS + 1))
    else
      echo "✗ $industry FAILED — files too small (empty content?)"
      echo "  PPTX: ${PPTX:-none} (${PPTX_SIZE:-0}b), Guide: ${GUIDE:-none} (${GUIDE_SIZE:-0}b)"
      FAIL=$((FAIL + 1))
    fi
  else
    echo "✗ $industry FAILED — output files not created"
    echo "  PPTX: ${PPTX:-none}, Guide: ${GUIDE:-none}"
    FAIL=$((FAIL + 1))
  fi

  rm -f output/test-company-*-workshop.pptx output/test-company-*-workshop-guide.md
  sleep 3
done

echo ""
echo "Results: $PASS passed, $FAIL failed"
exit "$FAIL"
