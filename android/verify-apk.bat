@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\print\AppData\Local\Android\Sdk"
echo Verifying APK signature...
"%ANDROID_HOME%\build-tools\35.0.0\apksigner.bat" verify --print-certs "%~dp0app-release-signed.apk"
if %ERRORLEVEL% equ 0 (
    echo APK signature verified successfully!
    for %%i in ("%~dp0app-release-signed.apk") do (
        echo APK Size: %%~zi bytes (%%~zi / 1048576 = ~%%~zi bytes)
    )
) else (
    echo APK verification failed!
)
