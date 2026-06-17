@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\print\AppData\Local\Android\Sdk"
set "BUBBLEWRAP_KEYSTORE_PASSWORD=iesfuego123"
set "BUBBLEWRAP_KEY_PASSWORD=iesfuego123"
set "BT=%ANDROID_HOME%\build-tools\35.0.0"
cd /d "%~dp0"

echo 1. Building with Gradle...
call gradlew.bat assembleRelease --stacktrace
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo 2. Zipaligning...
"%BT%\zipalign.exe" -p -f 4 "app\build\outputs\apk\release\app-release-unsigned.apk" "app-release-aligned.apk"

echo 3. Signing (v1+v2)...
"%BT%\apksigner.bat" sign --ks "%~dp0iesfuego.keystore" --ks-key-alias iesfuego --ks-pass pass:iesfuego123 --key-pass pass:iesfuego123 --v1-signing-enabled true --v2-signing-enabled true --min-sdk-version 21 --out "%~dp0app-release-signed.apk" "%~dp0app-release-aligned.apk"
if %ERRORLEVEL% equ 0 (
  del "%~dp0app-release-aligned.apk" 2>nul
  echo 4. Verifying...
  "%BT%\apksigner.bat" verify --print-certs "%~dp0app-release-signed.apk"
  echo.
  echo APK ready: %~dp0app-release-signed.apk
) else (
  echo Signing failed!
  exit /b 1
)
