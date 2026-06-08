@echo off
rem Script to re-initialize the Gradle Wrapper to 8.11.1 on Windows.
rem Run this script from the workspace root or the /android directory.

cd /d "%~dp0"

echo ==========================================================
echo 🛡️ Re-initializing SmartGate Gradle Wrapper to 8.11.1...
echo ==========================================================

if exist gradle\wrapper\gradle-wrapper.jar (
    echo 🧹 Removing legacy/corrupt gradle-wrapper.jar...
    del /f /q gradle\wrapper\gradle-wrapper.jar
)

where gradle >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 🚀 Running "gradle wrapper --gradle-version 8.11.1"...
    gradle wrapper --gradle-version 8.11.1
    
    if exist gradle\wrapper\gradle-wrapper.jar (
         echo ✅ Success! New gradle-wrapper.jar generated successfully.
    ) else (
         echo ⚠️ Gradle wrapper jar was not generated. Please check for errors above.
    )
) else (
    echo ❌ Error: "gradle" command not found in your system PATH.
    echo    Please install Gradle 8.x or configure your environment variables.
    echo    Alternative: You can download the pristine gradle-wrapper.jar manually from:
    echo    https://raw.githubusercontent.com/gradle/gradle/v8.11.1/gradle/wrapper/gradle-wrapper.jar
)

pause
