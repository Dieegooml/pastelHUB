#!/usr/bin/env node

/**
 * RATE LIMIT VISUALIZATION SCRIPT
 * 
 * Muestra visualmente cómo funciona el rate limiting
 * Ejecutar: node test-rate-limit.js
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Simulación de rate limiting
class RateLimitTester {
  constructor(maxRequests, windowMs, testName) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.testName = testName;
    this.requestLog = [];
  }

  async testRateLimit() {
    console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}TEST: ${this.testName}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}Límite: ${this.maxRequests} requests cada ${this.windowMs / 60000} minutos${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

    // Simular requests
    for (let i = 1; i <= this.maxRequests + 5; i++) {
      const isAllowed = i <= this.maxRequests;
      const status = isAllowed ? 200 : 429;
      const statusText = isAllowed ? 'OK ✓' : 'TOO MANY REQUESTS ✗';
      const color = isAllowed ? colors.green : colors.red;

      console.log(
        `${colors.bold}Request #${String(i).padStart(3)}${colors.reset} → ` +
        `${color}${status} ${statusText}${colors.reset} | ` +
        `Remaining: ${Math.max(0, this.maxRequests - i + 1).toString().padStart(2)}`
      );

      // Mostrar mensaje cuando se alcanza el límite
      if (i === this.maxRequests) {
        console.log(`${colors.yellow}${colors.bold}⚠️  LÍMITE ALCANZADO${colors.reset}`);
      }

      if (i === this.maxRequests + 1) {
        console.log(`${colors.red}❌ BLOQUEADO: ${colors.bold}Error: Demasiadas peticiones, intenta en ${this.windowMs / 60000} minutos${colors.reset}`);
      }

      // Pequeña pausa para que sea visible
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

async function main() {
  console.clear();
  console.log(`\n${colors.bold}${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}║      🛡️  PASTELHUB - RATE LIMITING VISUALIZATION 🛡️      ║${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Test 1: Rate limit general
  const generalTest = new RateLimitTester(100, 15 * 60 * 1000, 'LÍMITE GENERAL DE API');
  await generalTest.testRateLimit();

  // Pausa entre tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Rate limit de autenticación
  const authTest = new RateLimitTester(10, 15 * 60 * 1000, 'LÍMITE DE AUTENTICACIÓN (/api/auth)');
  await authTest.testRateLimit();

  // Resumen
  console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.green}✓ TEST COMPLETADO${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.bold}📊 RESUMEN:${colors.reset}`);
  console.log(`  • ${colors.green}Límite general: 100 req/15min${colors.reset}`);
  console.log(`  • ${colors.green}Límite de auth: 10 req/15min${colors.reset}`);
  console.log(`  • ${colors.green}Estado 429: Enviado cuando se supera el límite${colors.reset}`);
  console.log(`  • ${colors.green}Mensaje personalizado en cada error${colors.reset}\n`);

  console.log(`${colors.yellow}💡 TIP: En producción, esto está implementado en ${colors.bold}server/src/app.js${colors.reset}\n`);
}

main().catch(console.error);
