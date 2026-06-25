@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   DESCARGANDO ACTUALIZACIONES
echo ========================================

:: Descargar los ultimos cambios
git pull
if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERROR AL ACTUALIZAR - revisa el mensaje de arriba
    ec