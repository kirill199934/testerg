#!/bin/bash

echo "========================================"
echo " TravHouse API Plugin Builder"
echo "========================================"
echo

# Проверка Java
echo "Проверка Java..."
if ! command -v java &> /dev/null; then
    echo "ОШИБКА: Java не найдена! Установите Java 17+"
    exit 1
fi

java_version=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | sed '/^1\./s///' | cut -d'.' -f1)
if [ "$java_version" -lt 17 ]; then
    echo "ОШИБКА: Требуется Java 17+, установлена версия $java_version"
    exit 1
fi

# Проверка Maven
echo "Проверка Maven..."
if ! command -v mvn &> /dev/null; then
    echo "ОШИБКА: Maven не найден! Установите Maven"
    exit 1
fi

echo
echo "Сборка плагина..."
mvn clean package

if [ $? -ne 0 ]; then
    echo
    echo "ОШИБКА: Сборка не удалась!"
    exit 1
fi

echo
echo "========================================"
echo " Сборка завершена успешно!"
echo "========================================"
echo
echo "Файл плагина: target/TravHouseAPI-1.0-SNAPSHOT.jar"
echo

if [ -f "target/TravHouseAPI-1.0-SNAPSHOT.jar" ]; then
    echo "Размер файла:"
    ls -lh target/TravHouseAPI-1.0-SNAPSHOT.jar | awk '{print $5 " " $9}'
    echo
    
    read -p "Скопировать плагин в папку сервера? (y/n): " copy_plugin
    if [[ $copy_plugin =~ ^[Yy]$ ]]; then
        read -p "Введите путь к папке plugins сервера: " server_path
        if [ -d "$server_path" ]; then
            cp "target/TravHouseAPI-1.0-SNAPSHOT.jar" "$server_path/TravHouseAPI.jar"
            echo "Плагин скопирован в $server_path/TravHouseAPI.jar"
        else
            echo "Папка не найдена: $server_path"
        fi
    fi
fi

echo
echo "Готово! Перезапустите сервер для применения изменений."