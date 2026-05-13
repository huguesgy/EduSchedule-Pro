@echo off
TITLE EduSchedule Pro - Unified Starter
SETLOCAL

:: Couleurs pour la console (Bleu sur Noir)
color 0B

echo ==========================================================
echo           EDUSCHEDULE PRO - DEMARRAGE WINDOWS
echo ==========================================================
echo.

:: Vérification de PHP
php -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] PHP n'est pas installe ou n'est pas dans le PATH.
    pause
    exit /b
)

:: Vérification de Node.js/NPM
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] NPM (Node.js) n'est pas installe ou n'est pas dans le PATH.
    pause
    exit /b
)

echo [1/2] Lancement du BACKEND (PHP Server)...
:: Lance PHP dans une nouvelle fenêtre console
start "EduSchedule - Backend" cmd /k "echo Lancement du Backend sur 127.0.0.1:8000... && php -S 127.0.0.1:8000 -t backend"

echo [2/2] Lancement du FRONTEND (React/Vite)...
:: Lance NPM dans une nouvelle fenêtre console
start "EduSchedule - Frontend" cmd /k "echo Lancement du Frontend... && cd frontend && npm run dev"

echo.
echo ==========================================================
echo     L'APPLICATION EST EN COURS DE DEMARRAGE !
echo ==========================================================
echo.
echo  - BACKEND  : http://localhost:8000
echo  - FRONTEND : http://localhost:5173 (par defaut)
echo.
echo Gardez les deux autres fenetres ouvertes pour le fonctionnement.
echo Appuyez sur une touche pour fermer ce lanceur.
echo ==========================================================

pause >nul
exit