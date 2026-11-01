@echo off
setlocal enabledelayedexpansion
title 21N2 Billiards Scoreboard Server

:: Ensure we run from the project root directory where run-server.cmd is located
cd /d "%~dp0"

:: 1. Try standard 'python' in PATH
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python "%~dp0tools\serve.py" %*
    goto :done
)

:: 2. Try Python launcher 'py'
where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    py -3 "%~dp0tools\serve.py" %*
    goto :done
)

:: 3. Try local virtualenv Python if present
if exist "%~dp0.venv\Scripts\python.exe" (
    "%~dp0.venv\Scripts\python.exe" "%~dp0tools\serve.py" %*
    goto :done
)

:: 4. If Python is not installed or not in PATH
echo.
echo ========================================================================
echo  [ERROR] Python was not found on this system!
echo ========================================================================
echo  To run the 21N2 Billiards Scoreboard local server:
echo  1. Download Python 3 from https://www.python.org/downloads/
echo  2. IMPORTANT: Check "Add Python to PATH" during installation.
echo ========================================================================
echo.
pause

:done
endlocal
