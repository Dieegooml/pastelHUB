#!/bin/bash
set -euo pipefail

# ============================================================
# deploy.sh — Despliegue completo de PastelHub a GCP
# Uso: bash deploy.sh [--skip-build] [--skip-hosting]
# ============================================================

PROJECT_ID="pastehub-2d2b2"
REGION="us-central1"
SERVICE_NAME="pastelhub-server"
REPO_NAME="pastelhub"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}"

# Colores para output
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Verificar prerequisitos
command -v gcloud >/dev/null 2>&1 || error "gcloud CLI no instalado"
command -v firebase >/dev/null 2>&1 || error "Firebase CLI no instalado"
command -v docker >/dev/null 2>&1 || error "Docker no instalado"

gcloud config get-value project 2>/dev/null | grep -q "${PROJECT_ID}" || \
  error "Ejecuta: gcloud config set project ${PROJECT_ID}"

# ============================================================
# FASE 1: Backend — Cloud Run
# ============================================================
deploy_backend() {
  info "=== FASE 1: Backend en Cloud Run ==="

  # 1. Crear Artifact Registry si no existe
  if ! gcloud artifacts repositories describe ${REPO_NAME} --location=${REGION} >/dev/null 2>&1; then
    info "Creando Artifact Registry: ${REPO_NAME}"
    gcloud artifacts repositories create ${REPO_NAME} \
      --repository-format=docker \
      --location=${REGION}
  else
    info "Artifact Registry ${REPO_NAME} ya existe"
  fi

  # 2. Construir y pushear imagen
  info "Construyendo imagen Docker..."
  cd server
  docker build -t ${IMAGE_NAME}:latest .
  docker push ${IMAGE_NAME}:latest
  cd ..

  # 3. Desplegar Cloud Run
  info "Desplegando Cloud Run service: ${SERVICE_NAME}"

  gcloud run deploy ${SERVICE_NAME} \
    --image=${IMAGE_NAME}:latest \
    --region=${REGION} \
    --allow-unauthenticated \
    --cpu=1 \
    --memory=512Mi \
    --min-instances=0 \
    --max-instances=10 \
    --concurrency=80 \
    --timeout=300 \
    --set-env-vars="NODE_ENV=production,CLIENT_URL=https://${PROJECT_ID}.web.app" \
    --update-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest,GEMINI_API_KEY=gemini-api-key:latest" \
    --set-env-vars="FIREBASE_PROJECT_ID=${PROJECT_ID},FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@${PROJECT_ID}.iam.gserviceaccount.com"

  # 4. Obtener URL
  CLOUD_RUN_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
  echo ""
  info "Backend desplegado en: ${CLOUD_RUN_URL}"
  echo "  HEALTH: ${CLOUD_RUN_URL}/api/health"
  echo ""
}

# ============================================================
# FASE 2: Frontend — Firebase Hosting
# ============================================================
deploy_frontend() {
  info "=== FASE 2: Frontend en Firebase Hosting ==="

  # 1. Construir frontend con variables de produccion
  info "Construyendo frontend..."
  cd client
  npm ci
  npm run build
  cd ..

  # 2. Desplegar hosting
  info "Desplegando Firebase Hosting..."
  firebase deploy --only hosting

  echo ""
  info "Frontend desplegado en: https://${PROJECT_ID}.web.app"
  echo ""
}

# ============================================================
# POST: Verificacion
# ============================================================
verify() {
  info "=== Verificacion post-despliegue ==="
  HOSTING_URL="https://${PROJECT_ID}.web.app"
  echo "  Hosting:   ${HOSTING_URL}"
  echo "  Login:     ${HOSTING_URL}/login"
  echo "  Health:    ${HOSTING_URL}/api/health"
  echo ""
  echo "  Probar health: curl ${HOSTING_URL}/api/health"
  echo ""
}

# ============================================================
# MAIN
# ============================================================
main() {
  SKIP_BUILD=false
  SKIP_HOSTING=false

  for arg in "$@"; do
    case "$arg" in
      --skip-build) SKIP_BUILD=true ;;
      --skip-hosting) SKIP_HOSTING=true ;;
      *) error "Argumento desconocido: $arg" ;;
    esac
  done

  echo ""
  echo "============================================"
  echo "  PastelHub — Deploy a GCP"
  echo "============================================"
  echo "  Proyecto: ${PROJECT_ID}"
  echo "  Region:   ${REGION}"
  echo "  Service:  ${SERVICE_NAME}"
  echo "============================================"
  echo ""

  if [ "$SKIP_BUILD" = false ]; then
    deploy_backend
  else
    warn "Saltando build backend (--skip-build)"
  fi

  if [ "$SKIP_HOSTING" = false ]; then
    deploy_frontend
  else
    warn "Saltando deploy frontend (--skip-hosting)"
  fi

  verify
}

main "$@"
