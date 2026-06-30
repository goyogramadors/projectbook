@echo off
chcp 65001 >nul
title Archiblocks - Bajar Cambios (git pull)
cd /d "C:\G\Archiblocks"

echo ============================================================
echo   ARCHIBLOCKS  -  Bajar cambios desde GitHub (git pull)
echo   Usalo al empezar a trabajar, sobre todo si vienes de otro PC.
echo ============================================================
echo.

echo == Limpiando locks de git (si existen) ==
del /f /q ".git\index.lock"            >nul 2>&1
del /f /q ".git\HEAD.lock"             >nul 2>&1
del /f /q ".git\config.lock"           >nul 2>&1
del /f /q ".git\ORIG_HEAD.lock"        >nul 2>&1
del /f /q ".git\refs\heads\*.lock"     >nul 2>&1
del /f /q ".git\objects\maintenance.lock" >nul 2>&1
echo.

echo == git pull ==
git pull origin main

echo.
if errorlevel 1 (
  echo [AVISO] Si hubo conflicto o error, revisa el mensaje de arriba.
) else (
  echo [OK] Repositorio actualizado con la ultima version.
)
echo.
pause
