# Load Tests en Cloud — CMD (Windows)

Servidor: **8 CPU / 4GB RAM / 500 concurrency / 2-25 instances / 600s timeout**

---

## Preparación

Para tests con **>1000 VUs** es necesario activar el bypass de auth y rate limits:

```cmd
REM Activar (antes del test)
gcloud run services update pastelhub-server --region=us-central1 ^
  --update-env-vars=LOAD_TEST=true

REM Desactivar (despues del test — OBLIGATORIO en produccion)
gcloud run services update pastelhub-server --region=us-central1 ^
  --remove-env-vars=LOAD_TEST
```

---

## 500 VUs

### Ejecutar
```cmd
REM Normal (~5 min)
gcloud run jobs execute k6-load-test --region=us-central1 ^
  --update-env-vars=MAX_VUS=500

REM Rapido (~45s)
gcloud run jobs execute k6-load-test --region=us-central1 ^
  --update-env-vars=QUICK=true,MAX_VUS=500
```

### Resultados
| P95 | Fallos | Throughput |
|-----|--------|-----------|
| — | — | — |


---

## 1000 VUs

### Ejecutar
```cmd
REM Normal (~7 min, default del job)
gcloud run jobs execute k6-load-test --region=us-central1

REM Rapido (~2 min)
gcloud run jobs execute k6-load-test --region=us-central1 ^
  --update-env-vars=QUICK=true,MAX_VUS=1000
```

### Resultados
| P95 | Fallos | Throughput |
|-----|--------|-----------|
| **2,982ms** | **0.0%** | 313 req/s |

✅ Pasa threshold 5s

---

## 2000 VUs

### Ejecutar
```cmd
REM Rapido (~3 min)
gcloud run jobs execute k6-load-test --region=us-central1 ^
  --update-env-vars=QUICK=true,MAX_VUS=2000,STEADY_MINUTES=1
```

### Resultados
| P95 | Fallos | Throughput |
|-----|--------|-----------|
| **3,089ms** | **0.0%** | 652 req/s |

✅ Pasa threshold 5s

---

## 5000 VUs

### Ejecutar
```cmd
REM Normal (~8 min)
gcloud run jobs execute k6-load-test --region=us-central1 ^
  --update-env-vars=MAX_VUS=10000

REM Rapido (~2 min)
gcloud run jobs execute k6-load-test --region=us-central1 ^
  --update-env-vars=QUICK=true,MAX_VUS=5000,STEADY_MINUTES=0
```

### Resultados
| Modo | P95 | Fallos | Throughput |
|------|-----|--------|-----------|
| QUICK | 17,581ms | 10.4% | 687 req/s |
| gradual (105s) | 15,518ms | 2.9% | 649 req/s |
| gradual + min=5 | 15,685ms | 13.4% | — |

❌ Firestore saturado — no pasa threshold 5s

**Observacion:** Mas instancias empeoran los fallos (2.9% → 13.4%). El cuello de botella es Firestore, no el compute.

## Ver resultado

```cmd
REM Listar reportes disponibles
gcloud storage ls gs://pastehub-2d2b2-backups/load-reports/

REM Descargar reporte especifico
gcloud storage cp gs://pastehub-2d2b2-backups/load-reports/k6-report-2000vus-2026-06-05T14-51-14.html .

REM Descargar el mas reciente
gcloud storage cp gs://pastehub-2d2b2-backups/load-reports/k6-report-*.html .

REM Ver logs de una ejecucion especifica
gcloud run jobs executions describe k6-load-test-xxxxx --region=us-central1

REM Ver resultado en consola (esperar a que termine)
gcloud run jobs executions describe k6-load-test-xxxxx --region=us-central1 ^
  --format=json | ConvertFrom-Json | Select -ExpandProperty status | Select -ExpandProperty conditions
```

El signed URL del reporte se imprime en los logs del job (vigencia 1h).
