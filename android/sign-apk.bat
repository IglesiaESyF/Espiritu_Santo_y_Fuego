@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\print\AppData\Local\Android\Sdk"
"%ANDROID_HOME%\build-tools\35.0.0\apksigner.bat" sign --ks "%~dp0iesfuego.keystore" --ks-key-alias iesfuego --ks-pass pass:iesfuego123 --key-pass pass:iesfuego123 --out "%~dp0app-release-signed.apk" "%~dp0app\build\outputs\apk\release\app-release-unsigned.apk"
if %ERRORLEVEL% equ 0 (
    echo Signed APK: %~dp0app-release-signed.apk
) else (
    echo Signing failed!
)
