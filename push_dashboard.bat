@echo off
set "PATH=C:\Users\srinidhi\AppData\Local\Programs\Git\cmd;C:\Users\srinidhi\AppData\Local\Programs\Git\mingw64\bin;%PATH%"
cd /d "%~dp0"

echo ======================================================================
echo  NetForecast AI: Pushing feature/dashboard
echo  Repository: https://github.com/nagarjuna-32/cyber-network-traffic
echo  Account: srinidhi2153
echo ======================================================================
echo.

git push -u origin feature/dashboard

echo.
echo ======================================================================
if %ERRORLEVEL% EQU 0 (
    echo  SUCCESS: feature/dashboard has been pushed to GitHub!
) else (
    echo  Push encountered an issue. See message above.
)
echo ======================================================================
echo.
pause
