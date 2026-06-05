#!/bin/bash
# ============================================================
# smoke-test.sh — Smoke tests post-despliegue de PastelHub
# Verifica health endpoint, endpoints criticos y frontend.
# Uso: bash smoke-test.sh <backend-url> [frontend-url]
# Ej:  bash smoke-test.sh https://pastelhub-server-xxxxx-uc.a.run.app
#      bash smoke-test.sh https://pastelhub-server-xxxxx-uc.a.run.app https://pastehub-2d2b2.web.app
# ============================================================
set -euo pipefail

URL="${1:-}"
HOSTING_URL="${2:-}"

if [ -z "$URL" ]; then
  echo "Uso: $0 <backend-url> [frontend-url]"
  echo "Ej: $0 https://pastelhub-server-xxxxx-uc.a.run.app"
  exit 1
fi

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; FAILED=1; }
info() { echo -e "${YELLOW}[INFO]${NC} $1"; }

FAILED=0

echo ""
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}  PastelHub — Smoke Tests${NC}"
echo -e "${YELLOW}============================================${NC}"
echo -e "  Backend:  ${URL}"
echo -e "  Frontend: ${HOSTING_URL:-N/A}"
echo -e "${YELLOW}============================================${NC}"
echo ""

# Helper: curl con timeout de 10s
curl_cmd() {
  curl -s --max-time 10 "$@" 2>/dev/null || echo ""
}

# 1. Health check
info "Test 1: Health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${URL}/api/health" 2>/dev/null || echo "000")
BODY=$(curl_cmd "${URL}/api/health")
FIRESTORE=$(echo "$BODY" | grep -o '"firestore":"[^"]*"' | cut -d'"' -f4)
if [ "$HTTP_CODE" = "200" ] && [ "$FIRESTORE" = "connected" ]; then
  pass "Health check (HTTP ${HTTP_CODE}, Firestore: ${FIRESTORE})"
else
  fail "Health check (HTTP ${HTTP_CODE}, Firestore: ${FIRESTORE:-unknown})"
fi

# 2. Products endpoint (publico)
info "Test 2: Products endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${URL}/api/products?limit=1" 2>/dev/null || echo "000")
BODY=$(curl_cmd "${URL}/api/products?limit=1")
DATA_COUNT=$(echo "$BODY" | grep -o '"data"' | wc -l)
if [ "$HTTP_CODE" = "200" ]; then
  pass "Products endpoint (HTTP ${HTTP_CODE})"
else
  fail "Products endpoint (HTTP ${HTTP_CODE})"
fi

# 3. Shops endpoint (publico)
info "Test 3: Shops endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${URL}/api/shops?limit=1" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  pass "Shops endpoint (HTTP ${HTTP_CODE})"
else
  fail "Shops endpoint (HTTP ${HTTP_CODE})"
fi

# 4. 404 handling
info "Test 4: 404 handling..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${URL}/api/nonexistent" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "404" ]; then
  pass "404 handling (HTTP ${HTTP_CODE})"
else
  fail "404 handling (HTTP ${HTTP_CODE})"
fi

# 5. Response time (health debe responder en <2s)
info "Test 5: Response time..."
START=$(date +%s%N)
curl_cmd "${URL}/api/health" > /dev/null
END=$(date +%s%N)
MS=$(( (END - START) / 1000000 ))
if [ "$MS" -lt 2000 ]; then
  pass "Response time (${MS}ms < 2000ms)"
else
  fail "Response time (${MS}ms >= 2000ms)"
fi

# 6. Frontend (si se proporciono URL)
if [ -n "$HOSTING_URL" ]; then
  info "Test 6: Frontend loads..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 --location "${HOSTING_URL}" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    pass "Frontend loads (HTTP ${HTTP_CODE})"
  else
    fail "Frontend loads (HTTP ${HTTP_CODE})"
  fi
fi

echo ""
echo -e "${YELLOW}============================================${NC}"
if [ "$FAILED" = "0" ]; then
  echo -e "${GREEN}  Todos los smoke tests pasaron.${NC}"
else
  echo -e "${RED}  Algunos smoke tests FALLARON.${NC}"
fi
echo -e "${YELLOW}============================================${NC}"
echo ""
exit $FAILED
