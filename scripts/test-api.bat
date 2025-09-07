@echo off
REM JogGPS AI Coaching Backend - API Testing Script (Windows)
REM Usage: scripts\test-api.bat [BASE_URL]

set BASE_URL=%1
if "%BASE_URL%"=="" set BASE_URL=http://localhost:3000

echo Testing JogGPS AI Coaching Backend API at: %BASE_URL%
echo ==============================================

REM 1. Health Check
echo.
echo 1. Health Check
curl -s "%BASE_URL%/api/health"

REM 2. Profile Management
echo.
echo 2. Profile Management
curl -s -X POST -H "Content-Type: application/json" -d "{\"deviceId\":\"test-device-123\",\"trainingGoal\":{\"raceType\":\"10k\",\"targetTime\":2400,\"raceDate\":\"2024-06-15\"},\"recentRuns\":[]}" "%BASE_URL%/api/profile"

REM 3. Get Profile
echo.
echo 3. Get Profile
curl -s "%BASE_URL%/api/profile?deviceId=test-device-123"

REM 4. Log Run
echo.
echo 4. Log Run
curl -s -X POST -H "Content-Type: application/json" -d "{\"deviceId\":\"test-device-123\",\"date\":\"2024-01-15T10:30:00Z\",\"distance\":5000,\"duration\":1800,\"avgPace\":360}" "%BASE_URL%/api/runs"

REM 5. Get Run History
echo.
echo 5. Get Run History
curl -s "%BASE_URL%/api/runs?deviceId=test-device-123&limit=10"

REM 6. AI Coaching Request (requires valid OPENROUTER_API_KEY)
echo.
echo 6. AI Coaching Request
echo Note: This test requires a valid OPENROUTER_API_KEY
curl -s -X POST -H "Content-Type: application/json" -d "{\"deviceId\":\"test-device-123\",\"currentSegment\":{\"latitude\":40.7128,\"longitude\":-74.0060,\"timestamp\":1642261800000,\"heartRate\":150,\"speed\":3.5,\"elevation\":10.0,\"accuracy\":5.0,\"bearing\":180.0},\"runTotals\":{\"distance\":2500,\"duration\":900000,\"avgPace\":360,\"avgHeartRate\":145},\"intervalData\":{\"lastIntervalDistance\":500,\"lastIntervalTime\":180000,\"lastIntervalPace\":360,\"recentPaces\":[355,360,365],\"pacePattern\":\"consistent\"},\"trainingGoal\":{\"raceType\":\"10k\",\"targetTime\":2400,\"raceDate\":\"2024-06-15\"},\"model\":\"openai/gpt-4.1-nano\"}" "%BASE_URL%/api/coaching"

echo.
echo API testing completed!
echo Check the responses above for any errors or unexpected behavior.
pause