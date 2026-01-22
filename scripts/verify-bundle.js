/**
 * Script para verificar que el bundle de JavaScript se genere correctamente
 * Ejecutar antes de compilar la APK de release
 */

const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../android/app/src/main/assets/index.android.bundle');
const assetsPath = path.join(__dirname, '../android/app/src/main/assets');

console.log('Verificando bundle de JavaScript...\n');

if (!fs.existsSync(assetsPath)) {
  console.log('⚠️  Directorio assets no existe. Creándolo...');
  fs.mkdirSync(assetsPath, { recursive: true });
}

if (fs.existsSync(bundlePath)) {
  const stats = fs.statSync(bundlePath);
  console.log('✅ Bundle encontrado:', bundlePath);
  console.log('   Tamaño:', (stats.size / 1024).toFixed(2), 'KB');
  console.log('   Última modificación:', stats.mtime);
} else {
  console.log('❌ Bundle NO encontrado en:', bundlePath);
  console.log('\n💡 Para generar el bundle manualmente, ejecuta:');
  console.log('   npx expo export --platform android --output-dir android/app/src/main/assets');
}
