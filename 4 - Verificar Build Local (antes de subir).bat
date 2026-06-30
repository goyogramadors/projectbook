@echo off
chcp 65001 >nul
title Archiblocks - Verificar Build Local
cd /d "C:\G\Archiblocks\Web"

echo ============================================================
echo   ARCHIBLOCKS  -  Verificar que el proyecto compila
echo   (corre lo mismo que Cloudflare: npm run build)
echo ============================================================
echo.
echo Carpeta: %CD%
echo.

call npm run build

echo.
if errorlevel 1 (
  echo [ERROR] El build FALLO. NO subas aun: corrige los errores de arriba.
) else (
  echo [OK] Build correcto. Es seguro hacer commit y push.
)
echo.
pause
