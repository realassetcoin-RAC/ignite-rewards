@echo off
echo Starting RAC Rewards DAO API Server...
echo.

cd api

echo Installing dependencies...
call npm install

echo.
echo Starting API server...
echo API will be available at: http://localhost:3001
echo Health check: http://localhost:3001/health
echo.

call npm start

pause
