require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');
const { createBackup, ALL_COLLECTIONS } = require('./src/utils/backupService');

async function backup() {
  const collections = process.argv[2]
    ? process.argv[2].split(',').map(c => c.trim()).filter(c => ALL_COLLECTIONS.includes(c))
    : ALL_COLLECTIONS;

  if (!collections.length) {
    console.error('No hay colecciones válidas');
    process.exit(1);
  }

  const result = await createBackup(collections);
  const dir = path.join(__dirname, 'backups');
  fs.mkdirSync(dir, { recursive: true });

  const filename = result.filename;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, result.data);

  console.log(`\n✅ Backup completado: ${filename}`);
  console.log(`   Documentos: ${result.meta.total}`);
  console.log(`   Ubicación: ${filePath}\n`);

  const parsedPath = path.parse(filePath);
  const metaPath = path.join(parsedPath.dir, parsedPath.name.replace(/\.json$/, '') + '.meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(result.meta, null, 2));
  console.log(`   Meta: ${metaPath}\n`);
}

backup().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
