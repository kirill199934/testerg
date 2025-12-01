@echo off
echo ========================================
echo  Загрузка Spigot API для сборки
echo ========================================
echo.

echo Скачивание Spigot 1.20.1...
echo Это может занять некоторое время...

powershell -Command "Invoke-WebRequest -Uri 'https://download.getbukkit.org/spigot/spigot-1.20.1.jar' -OutFile 'spigot-1.20.1.jar'"

if exist "spigot-1.20.1.jar" (
    echo.
    echo Spigot успешно скачан!
    dir spigot-1.20.1.jar | find "spigot"
    echo.
    echo Теперь можете запустить build-simple.bat для сборки плагина
) else (
    echo.
    echo Не удалось скачать Spigot.
    echo Попробуйте скачать вручную с https://getbukkit.org/download/spigot
)

echo.
pause