require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const readline = require('readline');
const {
  listBackups,
  restoreBackup,
  validateBackup,
  getBackupStats,
} = require('./src/utils/restoreService');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

function parseArgs() {
  const args = {
    filename: null,
    dryRun: false,
    collections: null,
    force: false,
    list: false,
    validate: false,
    info: false,
  };

  let i = 2;
  while (i < process.argv.length) {
    const arg = process.argv[i];
    if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--force') {
      args.force = true;
    } else if (arg === '--list') {
      args.list = true;
    } else if (arg === '--validate') {
      args.validate = true;
    } else if (arg === '--info') {
      args.info = true;
    } else if (arg === '--collections' && i + 1 < process.argv.length) {
      args.collections = process.argv[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (!arg.startsWith('--')) {
      args.filename = arg;
    }
    i++;
  }

  return args;
}

async function main() {
  const args = parseArgs();

  if (args.list) {
    console.log('\nBackups disponibles:\n');
    const backups = await listBackups();
    if (backups.length === 0) {
      console.log('  No se encontraron backups.');
      return;
    }
    backups.forEach((b, i) => {
      const size = (b.size / 1024 / 1024).toFixed(2);
      const date = new Date(b.updated).toLocaleString('es-MX');
      console.log(`  ${i + 1}. ${b.filename}  (${size} MB, ${date}, ${b.source})`);
    });
    return;
  }

  if (args.validate) {
    if (!args.filename) {
      console.error('Error: Se requiere --filename. Uso: node restore.js --validate <filename>');
      process.exit(1);
    }
    console.log(`\nValidando backup: ${args.filename}\n`);
    const result = await validateBackup(args.filename);
    console.log(`  Válido: ${result.valid ? 'SÍ' : 'NO'}`);
    console.log(`  Versión: ${result.version || 'N/A'}`);
    console.log(`  Timestamp: ${result.timestamp || 'N/A'}`);
    console.log(`  Total documentos: ${result.totalDocs}`);
    console.log(`  Colecciones: ${result.collections.length}`);
    if (result.errors.length) {
      console.log('\n  Errores:');
      result.errors.forEach(e => console.log(`    - ${e}`));
    }
    if (result.warnings.length) {
      console.log('\n  Advertencias:');
      result.warnings.forEach(w => console.log(`    - ${w}`));
    }
    console.log('');
    return;
  }

  if (args.info) {
    if (!args.filename) {
      console.error('Error: Se requiere --filename. Uso: node restore.js --info <filename>');
      process.exit(1);
    }
    console.log(`\nEstadísticas del backup: ${args.filename}\n`);
    const stats = await getBackupStats(args.filename);
    console.log(`  Timestamp: ${stats.timestamp}`);
    console.log(`  Versión: ${stats.version}`);
    console.log(`  Total documentos: ${stats.totalDocs}`);
    console.log(`  Colecciones: ${stats.collectionCount}`);
    console.log('');
    stats.collections.forEach(c => {
      const err = c.hasError ? ' [ERROR]' : '';
      console.log(`    ${c.name}: ${c.docCount} docs${err}`);
    });
    if (Object.keys(stats.subcollectionSummary).length) {
      console.log('\n  Subcolecciones:');
      for (const [key, count] of Object.entries(stats.subcollectionSummary)) {
        if (count > 0) console.log(`    ${key}: ${count} docs`);
      }
    }
    console.log('');
    return;
  }

  if (!args.filename) {
    console.log('\nBuscando backups disponibles...\n');
    const backups = await listBackups({ limit: 10 });
    if (backups.length === 0) {
      console.error('No se encontraron backups. Especifica un nombre de archivo.');
      process.exit(1);
    }
    console.log('Backups encontrados:');
    backups.forEach((b, i) => {
      const size = (b.size / 1024 / 1024).toFixed(2);
      const date = new Date(b.updated).toLocaleString('es-MX');
      console.log(`  ${i + 1}. ${b.filename}  (${size} MB, ${date}, ${b.source})`);
    });
    console.log('');
    const choice = await ask('Selecciona el número del backup a restaurar (o escribe el nombre): ');
    const idx = parseInt(choice) - 1;
    args.filename = (idx >= 0 && idx < backups.length) ? backups[idx].filename : choice;
  }

  if (!args.force) {
    console.log('\n⚠  ADVERTENCIA: La restauración SOBREESCRIBIRÁ los datos existentes.');
    console.log(`   Archivo: ${args.filename}`);
    if (args.dryRun) console.log('   Modo: DRY RUN (simulación)');
    if (args.collections) console.log(`   Colecciones: ${args.collections.join(', ')}`);
    console.log('');
    const confirm = await ask('¿Continuar? (s/N): ');
    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'si') {
      console.log('Restauración cancelada.');
      return;
    }
  }

  console.log(`\nIniciando restauración de: ${args.filename}\n`);

  try {
    const result = await restoreBackup(args.filename, {
      collections: args.collections,
      dryRun: args.dryRun,
      conflictStrategy: args.force ? 'overwrite' : 'skip',
    });

    if (args.dryRun) {
      console.log('=== SIMULACIÓN DE RESTAURACIÓN ===\n');
    } else {
      console.log('=== RESTAURACIÓN COMPLETADA ===\n');
    }

    console.log(`  Archivo: ${result.filename}`);
    console.log(`  Timestamp: ${result.timestamp}`);
    console.log(`  Modo: ${result.dryRun ? 'Simulación' : 'Real'}`);
    console.log(`  Estrategia: ${result.conflictStrategy}`);
    console.log('');

    result.collections.forEach(c => {
      const label = c.status === 'empty' ? '(vacía)' : c.status === 'simulated' ? '(simulado)' : '';
      console.log(`  ${c.name}: ${c.mainDocs} docs principales, ${c.subDocs} subdocs ${label}`);
    });

    console.log('');
    console.log(`  Total documentos principales: ${result.mainDocs}`);
    console.log(`  Total documentos subcolecciones: ${result.subDocs}`);
    console.log(`  Total general: ${result.totalDocs}`);

    if (result.errors.length) {
      console.log(`\n  Errores (${result.errors.length}):`);
      result.errors.forEach(e => console.log(`    - ${e}`));
    }

    console.log('');
  } catch (err) {
    console.error(`\nError fatal: ${err.message}`);
    process.exit(1);
  }
}

main();
