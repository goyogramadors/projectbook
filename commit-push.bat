@echo off
cd /d C:\G\Archiblocks

echo Eliminando lock si existe...
if exist .git\index.lock del .git\index.lock

echo.
echo === git add -A ===
git add -A

echo.
echo === git commit ===
git commit -m "feat: flujo invitacion Premium completo + usuarios Free en panel admin - sendPremiumInviteEmail detecta usuario existente en Auth y lo promueve directo - AdminService.listUsers fusiona registrados + invitaciones pendientes (Pendiente) - AuthProvider aplica Premium en primer login si hay invitacion pendiente - firestore.rules nueva seccion premiumInvitations - AdminDashboard elimina mock, recarga tabla, filas Pendiente deshabilitadas"

echo.
echo === git push ===
git push origin main

echo.
echo === LISTO ===
echo Recuerda deployar en Firebase:
echo   cd Web
echo   firebase deploy --only functions,firestore:rules
echo.
pause
