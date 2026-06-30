@echo off
chcp 65001 >nul
title Archiblocks - Actualizar Reglas Firestore
cd /d "C:\G\Archiblocks\Web"

echo ============================================================
echo   ARCHIBLOCKS  -  Desplegar reglas de Firestore
echo ============================================================
echo.
echo Carpeta: %CD%
echo Comando: firebase deploy --only firestore:rules
echo.

call firebase deploy --only firestore:rules

echo.
if errorlevel 1 (
  echo [ERROR] El despliegue fallo. Revisa que firebase-cli este instalado
  echo         y que hayas iniciado sesion con: firebase login
) else (
  echo [OK] Reglas de Firestore desplegadas.
)
echo.
pause
