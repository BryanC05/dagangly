n@echo off
REM Quick Deployment Script for MSME Marketplace Android App
REM This script automates the deployment process for free distribution

echo ==========================================
echo MSME Marketplace - Quick Deployment
echo ==========================================
echo.

REM Check if we're in the mobile directory
if not exist "package.json" (
    echo Error: Please run this script from the mobile directory
    exit /b 1
)

echo Step 1: Checking prerequisites...
echo -----------------------------------

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed
    exit /b 1
)
for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo Node.js version: %NODE_VERSION%

echo.
echo Step 2: Validating configuration...
echo -----------------------------------

REM Run validation script
call npm run check:release
if errorlevel 1 (
    echo Warning: Configuration validation had warnings. Check output above.
    set /p CONTINUE="Continue anyway? (y/n) "
    if /I not "%CONTINUE%"=="y" exit /b 1
) else (
    echo Configuration validation passed
)

echo.
echo Step 3: Select build type
echo -----------------------------------
echo 1) Preview APK ^(FREE distribution - recommended for testing^)
echo 2) Production AAB ^(for Play Store submission^)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    set BUILD_PROFILE=preview
    echo Building Preview APK...
) else if "%choice%"=="2" (
    set BUILD_PROFILE=production
    echo Building Production AAB...
) else (
    echo Invalid choice
    exit /b 1
)

echo.
echo Step 4: Starting EAS Build
echo -----------------------------------
echo This will build the app in the cloud.
echo You can monitor progress at: https://expo.dev
echo.
pause

REM Start the build
call npx eas-cli@latest build --platform android --profile %BUILD_PROFILE% --non-interactive

echo.
echo ==========================================
echo Build Started Successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Monitor build progress at: https://expo.dev
echo 2. Download the artifact when complete
if "%BUILD_PROFILE%"=="preview" (
    echo 3. Share the APK via WhatsApp, email, or QR code
    echo 4. Users install by enabling 'Install from Unknown Sources'
) else (
    echo 3. Upload AAB to Google Play Console
    echo 4. Complete store listing and submit for review
)
echo.
echo For help, see: DEPLOYMENT_GUIDE.md

pause
