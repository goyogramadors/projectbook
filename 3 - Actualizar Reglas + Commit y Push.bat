@echo off
chcp 65001 >nul
title Archiblocks - Reglas + Commit y Push (todo)
echo ============================================================
echo   ARCHIBLOCKS  -  TODO: reglas Firestore + commit y push
echo ============================================================
echo.

echo ###############  PASO 1/2: REGLAS FIRESTORE  ###############
cd /d "C:\G\Archiblocks\Web"
call firebase deploy --only firestore:rules
if errorlevel 1 (
  echo.
  echo [ERROR] Fallo el despliegue de reglas. Se DETIENE antes del push.
  echo         Corrige y vuelve a ejecutar.
  echo.
  pause
  exit /b 1
)
echo [OK] Reglas desplegadas.
echo.

echo ###############  PASO 2/2: COMMIT Y PUSH  #################
cd /d "C:\G\Archiblocks"
echo == Limpiando locks de git ==
del /f /q ".git\index.lock"            >nul 2>&1
del /f /q ".git\HEAD.lock"             >nul 2>&1
del /f /q ".git\config.lock"           >nul 2>&1
del /f /q ".git\ORIG_HEAD.lock"        >nul 2>&1
del /f /q ".git\refs\heads\*.lock"     >nul 2>&1
del /f /q ".git\objects\maintenance.lock" >nul 2>&1

set "msg="
set /p "msg=Mensaje del commit (Enter = automatico con fecha): "
if "%msg%"=="" set "msg=update: cambios de sesion %date% %time%"

git add -A
git commit -m "%msg%"
git push origin main

echo.
echo [OK] Proceso completo: reglas desplegadas + cambios enviados a main.
echo.
pause
