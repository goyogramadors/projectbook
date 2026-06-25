@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   PREPARANDO CAMBIOS PARA GITHUB
echo ========================================

:: Agregar todos los archivos
git add -A

:: Pedir el mensaje del commit
set "mensaje="
set /p mensaje="Escribe el mensaje del commit (o Enter para 'Actualizacion automatica'): "
if "%mensaje%"=="" set "mensaje=Actualizacion automatica"

:: Crear el commit
git commit -m "%mensaje%"
if errorlevel 1 (
    echo.
    echo No habia cambios nuevos que guardar ^(o fallo el commit^).
    echo Intentando subir lo que ya estaba pendiente...
)

echo.
echo Subiendo a internet...
git push