@echo off
title AgroSmart Backend Server
color 0A

echo.
echo  ====================================
echo   AgroSmart Backend Starting...
echo  ====================================
echo.

:start
echo [%time%] Starting server...
node server.js

echo.
echo [%time%] Server stopped. Restarting in 2 seconds...
timeout /t 2 /nobreak >nul
goto start
