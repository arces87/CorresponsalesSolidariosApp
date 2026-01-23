/**
 * Script para verificar que la configuración de red esté correcta
 */

const fs = require('fs');
const path = require('path');

console.log('Verificando configuración de red para Android...\n');

// Verificar network_security_config.xml
const networkConfigPath = path.join(__dirname, '../android/app/src/main/res/xml/network_security_config.xml');
if (fs.existsSync(networkConfigPath)) {
  console.log('✅ network_security_config.xml encontrado');
  const content = fs.readFileSync(networkConfigPath, 'utf8');
  if (content.includes('190.116.29.99')) {
    console.log('✅ IP del servidor (190.116.29.99) configurada');
  } else {
    console.log('❌ IP del servidor NO encontrada en el archivo');
  }
  if (content.includes('cleartextTrafficPermitted="true"')) {
    console.log('✅ Cleartext traffic permitido');
  } else {
    console.log('❌ Cleartext traffic NO configurado');
  }
} else {
  console.log('❌ network_security_config.xml NO encontrado en:', networkConfigPath);
}

// Verificar AndroidManifest.xml
const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  console.log('\n✅ AndroidManifest.xml encontrado');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  if (manifestContent.includes('android:networkSecurityConfig="@xml/network_security_config"')) {
    console.log('✅ Referencia a network_security_config encontrada');
  } else {
    console.log('❌ Referencia a network_security_config NO encontrada');
  }
  if (manifestContent.includes('android:usesCleartextTraffic="true"')) {
    console.log('✅ usesCleartextTraffic="true" configurado');
  } else {
    console.log('❌ usesCleartextTraffic NO configurado');
  }
  if (manifestContent.includes('android.permission.INTERNET')) {
    console.log('✅ Permiso INTERNET encontrado');
  } else {
    console.log('❌ Permiso INTERNET NO encontrado');
  }
} else {
  console.log('❌ AndroidManifest.xml NO encontrado');
}

console.log('\n💡 Si todos los checks pasan, el problema podría ser:');
console.log('   1. El archivo no se está incluyendo en la APK');
console.log('   2. El dispositivo tiene restricciones de red adicionales');
console.log('   3. El servidor no es accesible desde la red del dispositivo');
console.log('   4. El puerto 9001 está bloqueado por firewall');
