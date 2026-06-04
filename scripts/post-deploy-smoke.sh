#!/usr/bin/env bash
# Post-deploy smoke tests for clinovyr.com (main site + client portal).
# Run after Cloudflare deploy, secrets, prisma migrate, and Stripe webhook setup.
#
# Usage:
#   ./scripts/post-deploy-smoke.sh
#   BASE_URL=https://staging.example.com ./scripts/post-deploy-smoke.sh

set -euo pipefail

BASE_URL="${BASE_URL:-https://clinovyr.com}"
BASE_URL="${BASE_URL%/}"

pass=0
fail=0

check() {
  local name="$1"
  local url="$2"
  local expect_code="${3:-200}"
  local method="${4:-GET}"

  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" -X "$method" "$url" || echo "000")

  if [[ "$code" == "$expect_code" ]] || [[ "$expect_code" == *"$code"* ]]; then
    echo "PASS  $name ($code) $url"
    pass=$((pass + 1))
  else
    echo "FAIL  $name (got $code, want $expect_code) $url"
    fail=$((fail + 1))
  fi
}

echo "Clinovyr post-deploy smoke — $BASE_URL"
echo ""

check "Home" "$BASE_URL/" "200"
check "Register" "$BASE_URL/auth/register" "200"
check "Login" "$BASE_URL/auth/login" "200"
check "Health JSON" "$BASE_URL/api/health" "200"

health_body=$(curl -sS "$BASE_URL/api/health" || true)
if echo "$health_body" | grep -q 'clinovyr-portal'; then
  echo "PASS  Health body contains clinovyr-portal"
  pass=$((pass + 1))
else
  echo "FAIL  Health body missing clinovyr-portal: $health_body"
  fail=$((fail + 1))
fi

# Admin should redirect unauthenticated users to login (302/307), not 404/500
admin_code=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE_URL/admin" || echo "000")
if [[ "$admin_code" == "302" || "$admin_code" == "307" || "$admin_code" == "303" ]]; then
  echo "PASS  Admin redirect ($admin_code) $BASE_URL/admin"
  pass=$((pass + 1))
else
  echo "FAIL  Admin (got $admin_code, want 302/307) $BASE_URL/admin"
  fail=$((fail + 1))
fi

# Stripe webhook route must exist (400/401 without signature is OK)
webhook_code=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/stripe" || echo "000")
if [[ "$webhook_code" != "404" && "$webhook_code" != "000" ]]; then
  echo "PASS  Stripe webhook route ($webhook_code) $BASE_URL/api/webhooks/stripe"
  pass=$((pass + 1))
else
  echo "FAIL  Stripe webhook (got $webhook_code) $BASE_URL/api/webhooks/stripe"
  fail=$((fail + 1))
fi

# Portal dashboard requires auth
dash_code=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE_URL/dashboard" || echo "000")
if [[ "$dash_code" == "302" || "$dash_code" == "307" || "$dash_code" == "303" ]]; then
  echo "PASS  Dashboard redirect ($dash_code) $BASE_URL/dashboard"
  pass=$((pass + 1))
else
  echo "FAIL  Dashboard (got $dash_code, want 302/307) $BASE_URL/dashboard"
  fail=$((fail + 1))
fi

echo ""
echo "Results: $pass passed, $fail failed"
if [[ "$fail" -gt 0 ]]; then
  exit 1
fi

echo "Smoke tests passed. Complete manual browser checks (register → survey → pay → deliverables)."
