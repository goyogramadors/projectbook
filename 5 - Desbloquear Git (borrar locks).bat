@echo off
chcp 65001 >nul
title Archiblocks - Desbloquear Git
cd /d "C:\G\Archiblocks"

echo ============================================================
echo   ARCHIBLOCKS  -  Desbloquear git (borra archivos .lock)
echo   Usalo si git dice "index.lock / HEAD.lock already exists".
echo ============================================================
echo.

del /f /q ".git\index.lock"            >nul 2>&1 && echo  - index.lock borrado
del /f /q ".git\HEAD.lock"             >nul 2>&1 && echo  - HEAD.lock borrado
del /f /q ".git\config.lock"           >nul 2>&1 && echo  - config.lock borrado
del /f /q ".git\ORIG_HEAD.lock"        >nul 2>&1 && echo  - ORIG_HEAD.lock borrado
del /f /q ".git\refs\heads\*.lock"     >nul 2>&1 && echo  - refs\heads\*.lock borrados
del /f /q ".git\objects\maintenance.lock" >nul 2>&1 && echo  - maintenance.lock borrado

echo.
echo [OK] Locks eliminados (los que existieran). Ya puedes usar git.
echo.
pause
