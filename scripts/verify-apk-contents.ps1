# Script para verificar que network_security_config.xml esté en la APK
param(
    [string]$ApkPath = "android\app\build\outputs\apk\release\app-release.apk"
)

Write-Host "Verificando contenido de la APK..." -ForegroundColor Green
Write-Host "APK: $ApkPath" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ApkPath)) {
    Write-Host "❌ APK no encontrada en: $ApkPath" -ForegroundColor Red
    Write-Host "💡 Compila la APK primero con: cd android; .\gradlew assembleRelease" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ APK encontrada" -ForegroundColor Green
Write-Host ""

# Intentar extraer y verificar
$tempDir = "$env:TEMP\apk_check_$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # Intentar usar 7zip si está disponible
    $sevenZip = Get-Command 7z -ErrorAction SilentlyContinue
    if ($sevenZip) {
        Write-Host "Extrayendo APK con 7zip..." -ForegroundColor Cyan
        & 7z x $ApkPath "-o$tempDir" -y | Out-Null
        
        $configFile = Join-Path $tempDir "res\xml\network_security_config.xml"
        if (Test-Path $configFile) {
            Write-Host "✅ network_security_config.xml encontrado en la APK" -ForegroundColor Green
            Write-Host "   Ubicación: res\xml\network_security_config.xml" -ForegroundColor Cyan
            Get-Content $configFile | Select-Object -First 10
        } else {
            Write-Host "❌ network_security_config.xml NO encontrado en la APK" -ForegroundColor Red
            Write-Host "   Buscando en: $tempDir" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Archivos en res:" -ForegroundColor Yellow
            if (Test-Path (Join-Path $tempDir "res")) {
                Get-ChildItem -Path (Join-Path $tempDir "res") -Recurse -File | Select-Object FullName | ForEach-Object {
                    Write-Host "  $($_.FullName.Replace($tempDir, ''))" -ForegroundColor Gray
                }
            }
        }
    } else {
        Write-Host "⚠️  7zip no encontrado. Instalando..." -ForegroundColor Yellow
        Write-Host "💡 Para verificar manualmente:" -ForegroundColor Yellow
        Write-Host "   1. Renombra la APK a .zip" -ForegroundColor Yellow
        Write-Host "   2. Extrae el contenido" -ForegroundColor Yellow
        Write-Host "   3. Busca: res\xml\network_security_config.xml" -ForegroundColor Yellow
    }
} finally {
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "💡 Si el archivo NO está en la APK:" -ForegroundColor Yellow
Write-Host "   1. Verifica que el archivo exista en: android\app\src\main\res\xml\network_security_config.xml" -ForegroundColor Yellow
Write-Host "   2. Limpia y recompila: cd android; .\gradlew clean assembleRelease" -ForegroundColor Yellow
Write-Host "   3. Verifica que shrinkResources esté deshabilitado en build.gradle" -ForegroundColor Yellow
