@echo off
cd /d "D:\"

:loop
echo [%time%] Cleaning Next.js cache...
if exist .next (
    rmdir /s /q .next
)

echo [%time%] Starting Next.js development server...
:: Spins up the exact pnpm instance that works manually
call pnpm run dev

echo.
echo [%time%] Warning: Server stopped or encountered an error.
echo [%time%] Restarting server in 5 seconds...
timeout /t 5 >nul
goto loop
