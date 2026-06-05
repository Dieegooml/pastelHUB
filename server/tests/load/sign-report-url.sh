#!/bin/bash
# Uso: ./sign-report-url.sh <report-file.html> [duration]
# Ej: ./sign-report-url.sh k6-report-100vus-2026-06-05T01-18-22.html
#     ./sign-report-url.sh k6-report-5000vus-2026-06-05T12-00-00.html 12h

set -euo pipefail

BUCKET="pastehub-2d2b2-backups"
REPORT="$1"
DURATION="${2:-1h}"

if [ -z "$REPORT" ]; then
  echo "Uso: $0 <report-file.html> [duration]" >&2
  echo "" >&2
  echo "Reportes disponibles:" >&2
  gcloud storage ls "gs://${BUCKET}/load-reports/" 2>/dev/null || echo "(no hay reportes en el bucket)"
  exit 1
fi

echo "Generando signed URL para gs://${BUCKET}/load-reports/${REPORT} ..." >&2
echo "Vigencia: ${DURATION}" >&2
echo "" >&2

gsutil signurl -i scheduler-sa@pastehub-2d2b2.iam.gserviceaccount.com \
  -d "${DURATION}" \
  "gs://${BUCKET}/load-reports/${REPORT}" 2>&1 | grep "^https://"
