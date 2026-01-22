# Script para obtener logs de Android
# Requiere que el dispositivo esté conectado y que adb esté en el PATH o en la ubicación de Android SDK

Write-Host "Obteniendo logs de Android..." -ForegroundColor Green
Write-Host "Asegúrate de que el dispositivo esté conectado y que la app esté instalada" -ForegroundColor Yellow
Write-Host ""

# Intentar encontrar adb
$adbPath = $null
if (Get-Command adb -ErrorAction SilentlyContinue) {
    $adbPath = "adb"
} elseif (Test-Path "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe") {
    $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
} elseif (Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe") {
    $adbPath = "$env:ANDROID_HOME\platform-tools\adb.exe"
} else {
    Write-Host "ERROR: No se encontró adb. Por favor:" -ForegroundColor Red
    Write-Host "1. Instala Android SDK Platform Tools" -ForegroundColor Yellow
    Write-Host "2. O agrega adb al PATH" -ForegroundColor Yellow
    Write-Host "3. O establece la variable ANDROID_HOME" -ForegroundColor Yellow
    exit 1
}

Write-Host "Usando adb en: $adbPath" -ForegroundColor Cyan

# Limpiar logs anteriores
& $adbPath logcat -c
Write-Host "Logs anteriores limpiados" -ForegroundColor Green

# Obtener logs
$logFile = "android-crash-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
Write-Host "Capturando logs en: $logFile" -ForegroundColor Cyan
Write-Host "Abre la app ahora. Cuando crashee, presiona Ctrl+C para detener la captura" -ForegroundColor Yellow
Write-Host ""

try {
    & $adbPath logcat *:E AndroidRuntime:E ReactNativeJS:E ReactNative:V ExpoModules:V > $logFile
} catch {
    Write-Host "Error al capturar logs: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Logs guardados en: $logFile" -ForegroundColor Green
Write-Host "Revisa el archivo para ver el error exacto" -ForegroundColor Cyan
