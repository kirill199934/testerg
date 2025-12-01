@echo off
echo ========================================
echo  TravHouse API Simple Plugin Builder
echo ========================================
echo.

echo Поиск Bukkit/Spigot API...

set BUKKIT_JAR=""
if exist "spigot-*.jar" set BUKKIT_JAR=spigot-*.jar
if exist "paper-*.jar" set BUKKIT_JAR=paper-*.jar
if exist "bukkit-*.jar" set BUKKIT_JAR=bukkit-*.jar

if "%BUKKIT_JAR%"=="" (
    echo ВНИМАНИЕ: Не найден JAR файл сервера в текущей папке
    echo Скачайте Spigot/Paper JAR файл и поместите его в эту папку
    echo Или укажите путь к JAR файлу сервера:
    set /p BUKKIT_JAR="Путь к JAR файлу сервера: "
    if "%BUKKIT_JAR%"=="" (
        echo Ошибка: JAR файл не указан
        pause
        exit /b 1
    )
)

echo Найден JAR файл: %BUKKIT_JAR%
echo.

echo Компиляция плагина...
javac -cp "%BUKKIT_JAR%" TravHouseAPIPlugin.java

if errorlevel 1 (
    echo ОШИБКА: Компиляция не удалась!
    pause
    exit /b 1
)

echo Создание JAR архива...
if not exist temp mkdir temp
copy TravHouseAPIPlugin.class temp\
copy plugin.yml temp\
copy config.yml temp\

cd temp
jar cf ..\TravHouseAPI.jar *
cd ..
rmdir /s /q temp

if exist "TravHouseAPI.jar" (
    echo.
    echo ========================================
    echo  Плагин создан успешно!
    echo ========================================
    echo.
    echo Файл: TravHouseAPI.jar
    dir TravHouseAPI.jar | find "TravHouse"
    echo.
    echo Скопируйте этот файл в папку plugins\ вашего сервера
    echo.
) else (
    echo ОШИБКА: Не удалось создать JAR файл
)

pause