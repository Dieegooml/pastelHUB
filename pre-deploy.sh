#!/bin/bash
# ============================================================
# pre-deploy.sh — Validacion pre-despliegue de PastelHub
# Ejecuta unit tests, lint, y rate limit test.
# Si algo falla, aborta con exit code != 0 (gating).
# Uso: bash pre-deploy.sh [--skip-client]
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }
info() { echo -e "${YELLOW}[INFO]${NC} $1"; }

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKIP_CLIENT=false
for arg in "$@"; do [ "$arg" = "--skip-client" ] && SKIP_CLIENT=true; done

echo ""
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}  PastelHub — Pre-deployment Validation${NC}"
echo -e "${YELLOW}============================================${NC}"
echo ""

run_test() {
  local name="$1"; shift
  info "=== ${name} ==="
  set +e
  "$@" 2>&1
  local rc=$?
  set -e
  if [ "$rc" -eq 0 ]; then
    pass "$name"
  else
    fail "$name (exit: $rc)"
  fi
}

run_test "Server unit tests" bash -c "cd '$PROJECT_DIR/server' && npm test"
run_test "Rate limit test" bash -c "cd '$PROJECT_DIR/server' && npm run test:rate-limit"

if [ "$SKIP_CLIENT" = false ]; then
  run_test "Client lint" bash -c "cd '$PROJECT_DIR/client' && npm run lint"
  run_test "Client unit tests" bash -c "cd '$PROJECT_DIR/client' && npm test"
else
  info "Saltando tests de cliente (--skip-client)"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Todas las pruebas pasaron.${NC}"
echo -e "${GREEN}  Listo para desplegar.${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
