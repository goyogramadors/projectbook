@echo off
chcp 65001 >nul
title Archiblocks - Probar Local (npm run dev)
cd /d "C:\G\Archiblocks\Web"

echo ============================================================
echo   ARCHIBLOCKS  -  Servidor local de desarrollo (Vite)
echo   Al terminar de cargar, abre la URL que aparezca
echo   (normalmente http://localhost:5173). Ctrl+C para detener.
echo ============================================================
echo.
echo Carpeta: %CD%
echo.

call npm run dev

echo.
echo [Servidor detenido]
pause
