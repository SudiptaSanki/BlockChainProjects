@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Milestone Crowdfund Launcher

if /I "%~1"=="level1" goto preview1
if /I "%~1"=="level2" goto preview2
if /I "%~1"=="level3" goto preview3
if /I "%~1"=="prod" goto previewprod
if /I "%~1"=="production" goto previewprod
if /I "%~1"=="dev1" goto dev1
if /I "%~1"=="dev2" goto dev2
if /I "%~1"=="dev3" goto dev3
if /I "%~1"=="devprod" goto devprod

goto menu

:menu
cls
echo ========================================
echo Milestone Crowdfund
echo ========================================
echo.
echo Open instant previews:
echo.
echo   1. Level 1 White Belt preview
echo   2. Level 2 Yellow Belt preview
echo   3. Level 3 Orange Belt preview
echo   4. Production Grade preview
echo.
echo Run Vite dev servers, requires npm install:
echo.
echo   5. Level 1 dev server
echo   6. Level 2 dev server
echo   7. Level 3 dev server
echo   8. Production dev server
echo.
echo   9. Exit
echo.
set /p choice=Enter choice 1-9: 
if "%choice%"=="1" goto preview1
if "%choice%"=="2" goto preview2
if "%choice%"=="3" goto preview3
if "%choice%"=="4" goto previewprod
if "%choice%"=="5" goto dev1
if "%choice%"=="6" goto dev2
if "%choice%"=="7" goto dev3
if "%choice%"=="8" goto devprod
if "%choice%"=="9" exit /b 0
echo.
echo Invalid choice.
pause
goto menu

:open_file
if not exist "%~1" (
  echo Preview file missing: %~1
  pause
  exit /b 1
)
start "" "%~1"
exit /b 0

:preview1
call :open_file "%~dp0level-1-white-belt\preview.html"
exit /b %ERRORLEVEL%

:preview2
call :open_file "%~dp0level-2-yellow-belt\preview.html"
exit /b %ERRORLEVEL%

:preview3
call :open_file "%~dp0level-3-orange-belt\preview.html"
exit /b %ERRORLEVEL%

:previewprod
call :open_file "%~dp0production-grade\preview.html"
exit /b %ERRORLEVEL%

:check_node
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js LTS, then run this launcher again.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Install Node.js LTS, then run this launcher again.
  pause
  exit /b 1
)
exit /b 0

:install_and_run
call :check_node
if errorlevel 1 exit /b 1

echo.
echo Project folder: %CD%
echo.
if not exist package.json (
  echo package.json was not found in this level folder.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies. This can take a few minutes the first time...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo npm install failed. Check the error above, then run this file again.
    pause
    exit /b 1
  )
)

echo.
echo Starting dev server...
echo When Vite prints a Local URL, open it in your browser.
echo Press Ctrl+C in this window to stop the server.
echo.
call npm run dev
set exitcode=%ERRORLEVEL%
echo.
echo Dev server stopped with exit code %exitcode%.
pause
exit /b %exitcode%

:dev1
cd /d "%~dp0level-1-white-belt"
goto install_and_run

:dev2
cd /d "%~dp0level-2-yellow-belt"
goto install_and_run

:dev3
cd /d "%~dp0level-3-orange-belt\frontend"
goto install_and_run

:devprod
cd /d "%~dp0production-grade"
goto install_and_run

