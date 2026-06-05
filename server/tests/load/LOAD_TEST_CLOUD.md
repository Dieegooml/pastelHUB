# Load Tests en Cloud — CMD (Windows)

## Ejecutar en Cloud Run Job

```cmd
REM 500 VUs (~5 min)
gcloud run jobs execute k6-load-test --region=us-central1 ^
  --update-env-vars=MAX_VUS=500

REM 500 VUs modo rapido (~45s)
gcloud run jobs execute k6-load-test --region=us-central1 ^
  --update-env-vars=QUICK=true,MAX_VUS=500

REM 1000 VUs (~7 min, default del job)
gcloud run jobs execute k6-load-test --region=us-central1

REM 5000 VUs (~8 min)
gcloud run jobs execute k6-load-test --region=us-central1 ^
  --update-env-vars=MAX_VUS=5000
```

## Scripts npm locales (requiere k6 instalado)

```cmd
cd server
npm run load-test:k6:500
npm run load-test:k6:500:quick
npm run load-test:k6:1000
npm run load-test:k6:5000
```

## Ver resultado

```cmd
REM Listar reportes
gcloud storage ls gs://pastehub-2d2b2-backups/load-reports/

REM Descargar ultimo reporte
gcloud storage cp gs://pastehub-2d2b2-backups/load-reports/k6-report-*.html .

REM Ver ultimo log del job
gcloud run jobs describe k6-load-test --region=us-central1
```

El signed URL del reporte se imprime en los logs del job (vigencia 1h).
