@echo off
chcp 65001 >nul
title Archiblocks - Commit y Push (main)
cd /d "C:\G\Archiblocks"

echo ============================================================
echo   ARCHIBLOCKS  -  Commit y Push a main (publica el frontend)
echo ============================================================
echo.

echo == Limpiando locks de git (si quedaron de una corrida anterior) ==
del /f /q ".git\index.lock"            >nul 2>&1
del /f /q ".git\HEAD.lock"             >nul 2>&1
del /f /q ".git\config.lock"           >nul 2>&1
del /f /q ".git\ORIG_HEAD.lock"        >nul 2>&1
del /f /q ".git\refs\heads\*.lock"     >nul 2>&1
del /f /q ".git\objects\maintenance.lock" >nul 2>&1
echo.

set "msg="
set /p "msg=Mensaje del commit (Enter = automatico con fecha): "
if "%msg%"=="" set "msg=update: cambios de sesion %date% %time%"

echo.
echo == git add -A ==
git add -A

echo == git commit ==
git commit -m "%msg%"

echo == git push origin main ==
git push origin main

echo.
if errorlevel 1 (
  echo [AVISO] Si dice "nothing to commit" no habia cambios.
  echo         Si fallo el push, revisa tu conexion / credenciales de GitHub.
) else (
  echo [OK] Cambios enviados. Cloudflare construira y publicara el sitio solo.
)
echo.
pause
