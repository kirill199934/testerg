@echo off
echo ========================================
echo  TravHouse API Plugin Builder
echo ========================================
echo.

echo Проверка Java...
java -version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Java не найдена! Установите Java 17+ 
    pause
    exit /b 1
)

echo Проверка Maven...
mvn -version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Maven не найден! Установите Maven
    pause
    exit /b 1
)

echo.
echo Сборка плагина...
mvn clean package

if errorlevel 1 (
    echo.
    echo ОШИБКА: Сборка не удалась!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Сборка завершена успешно!
echo ========================================
echo.
echo Файл плагина: target\TravHouseAPI-1.0-SNAPSHOT.jar
echo.
echo Скопируйте этот файл в папку plugins\ вашего сервера
echo.

if exist "target\TravHouseAPI-1.0-SNAPSHOT.jar" (
    echo Размер файла:
    dir "target\TravHouseAPI-1.0-SNAPSHOT.jar" | find "TravHouseAPI"
    echo.
    
    set /p copy_plugin="Скопировать плагин в папку сервера? (y/n): "
    if /i "%copy_plugin%"=="y" (
        set /p server_path="Введите путь к папке plugins сервера: "
        if exist "%server_path%" (
            copy "target\TravHouseAPI-1.0-SNAPSHOT.jar" "%server_path%\TravHouseAPI.jar"
            echo Плагин скопирован в %server_path%\TravHouseAPI.jar
        ) else (
            echo Папка не найдена: %server_path%
        )
    )
)

echo.
pause