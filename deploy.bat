@echo off
echo Building project...
call npm run build

IF %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo Deploying to Firebase...
call firebase deploy

IF %ERRORLEVEL% NEQ 0 (
    echo Deploy failed!
    pause
    exit /b %ERRORLEVEL%
)

echo Successfully built and deployed!
pause 