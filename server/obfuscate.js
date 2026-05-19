const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, 'src');
const DIST = path.resolve(__dirname, 'dist');

function getAllJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

function obfuscateFile(sourcePath, relativePath) {
  const code = fs.readFileSync(sourcePath, 'utf-8');
  const obfuscated = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    stringArray: true,
    stringArrayThreshold: 0.1,
    rotateStringArray: true,
    shuffleStringArray: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    identifierNamesGenerator: 'mangled-shuffled',
    renameGlobals: false,
    selfDefending: false,
    disableConsoleOutput: false,
  });

  const destPath = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, obfuscated.getObfuscatedCode(), 'utf-8');
  console.log(`  ✓ ${relativePath}`);
}

function copyNonJsFiles(dir, relativeDir = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      copyNonJsFiles(fullPath, relativePath);
    } else if (entry.isFile() && !entry.name.endsWith('.js')) {
      const destPath = path.join(DIST, relativePath);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(fullPath, destPath);
      console.log(`  ✓ ${relativePath} (copied)`);
    }
  }
}

console.log('Limpiando dist/...');
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
}

console.log('Ofuscando archivos JS...');
const files = getAllJsFiles(SRC);
for (const file of files) {
  const relative = path.relative(SRC, file);
  obfuscateFile(file, relative);
}

console.log('Copiando archivos no JS...');
copyNonJsFiles(SRC);

console.log('\n✓ Build de producción completado en dist/');
