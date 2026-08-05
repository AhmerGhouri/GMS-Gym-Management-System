@echo off
:: Switch to your D: drive project folder
cd /d "E:\GMS\GMS-Gym-Management-System"


:: 3. Inject local environment variables
if exist .env (
    for /f "usebackq tokens=* delims=" %%x in (".env") do (
        echo %%x | findstr /v "^#" >nul && set "%%x"
    )
)
:loop
echo [%time%] Cleaning Next.js cache...
if exist .next (
    rmdir /s /q .next
)

echo [%time%] Starting Next.js development server...
call pnpm run dev

echo.
echo [%time%] Warning: Server stopped or encountered an error.
echo [%time%] Restarting server in 3 seconds...
timeout /t 3 >nul
goto loop
