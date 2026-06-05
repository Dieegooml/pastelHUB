#!/bin/sh
set -e
k6 run /script.js "$@" || K6_EXIT=$?
REPORT_FILE=$(ls -t /tmp/k6-report-*.html 2>/dev/null | head -1)
if [ -n "$REPORT_BUCKET" ] && [ -n "$REPORT_FILE" ]; then
  BNAME=$(basename "$REPORT_FILE")
  DEST="gs://${REPORT_BUCKET}/load-reports/${BNAME}"
  echo "[UPLOAD] Subiendo reporte a ${DEST} ..."

  UPLOADED=
  if command -v gcloud >/dev/null 2>&1; then
    gcloud storage cp "$REPORT_FILE" "$DEST" 2>/dev/null \
      && { echo "[UPLOAD] Completo via gcloud"; UPLOADED=1; }
  fi

  if [ -z "$UPLOADED" ]; then
    META=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" -H "Metadata-Flavor: Google" 2>&1)
    TOKEN=$(echo "$META" | sed 's/.*"access_token":"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN" ] && [ "${#TOKEN}" -gt 10 ]; then
      curl -s -X PUT -T "$REPORT_FILE" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: text/html" \
        "https://storage.googleapis.com/${REPORT_BUCKET}/load-reports/${BNAME}" \
        && { echo "[UPLOAD] Completo via curl"; UPLOADED=1; } \
        || echo "[UPLOAD] Falló curl upload"
    else
      echo "[UPLOAD] Omitido — no se pudo obtener token GCP"
    fi
  fi

  if [ -n "$UPLOADED" ]; then
    echo "[UPLOAD] Generando signed URL (vigencia: 1h)..."
    SA=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email" -H "Metadata-Flavor: Google" 2>&1)
    TOKEN=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" -H "Metadata-Flavor: Google" 2>&1 | sed 's/.*"access_token":"\([^"]*\)".*/\1/')
    EXPIRES=$(($(date +%s) + 3600))
    STRING_TO_SIGN=$(printf "GET\n\n\n%s\n/%s/load-reports/%s" "$EXPIRES" "$REPORT_BUCKET" "$BNAME")
    PAYLOAD=$(printf "%s" "$STRING_TO_SIGN" | base64 -w0 2>/dev/null || printf "%s" "$STRING_TO_SIGN" | openssl base64 -e -A)
    SIGN_RESP=$(curl -s -X POST \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"payload\":\"${PAYLOAD}\"}" \
      "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${SA}:signBlob")
    SIGNATURE=$(echo "$SIGN_RESP" | jq -r '.signedBlob // ""')
    SIGNATURE_URL=$(echo "$SIGNATURE" | sed 's/\+/%2B/g; s/\//%2F/g; s/=/%3D/g')
    echo "[UPLOAD] Signed URL (1h):"
    echo "  https://storage.googleapis.com/${REPORT_BUCKET}/load-reports/${BNAME}?GoogleAccessId=${SA}&Expires=${EXPIRES}&Signature=${SIGNATURE_URL}"
  fi
fi
exit ${K6_EXIT:-0}
