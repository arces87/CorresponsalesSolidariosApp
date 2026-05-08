/**
 * Ejecuta Gradle bundleRelease para generar el AAB en:
 * android/app/build/outputs/bundle/release/app-release.aab
 */
const { execSync } = require('child_process');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');
const isWin = process.platform === 'win32';
const cmd = isWin ? 'gradlew.bat bundleRelease' : './gradlew bundleRelease';

execSync(cmd, { cwd: androidDir, stdio: 'inherit', shell: true });
