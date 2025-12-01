// Тестовый скрипт для проверки подключения к Minecraft серверу
require('dotenv').config();
const { Rcon } = require('rcon-client');
const mcQuery = require('mcquery');

// Конфигурация из переменных окружения
const config = {
    host: process.env.MC_HOST || 'localhost',
    port: parseInt(process.env.MC_PORT) || 25565,
    rconPort: parseInt(process.env.RCON_PORT) || 25575,
    rconPassword: process.env.RCON_PASSWORD || '',
    queryPort: parseInt(process.env.QUERY_PORT) || 25565
};

console.log('🧪 Тестирование подключения к Minecraft серверу...\n');
console.log('📊 Конфигурация:');
console.log(`   Хост: ${config.host}`);
console.log(`   Порт: ${config.port}`);
console.log(`   RCON порт: ${config.rconPort}`);
console.log(`   Query порт: ${config.queryPort}`);
console.log(`   RCON пароль: ${config.rconPassword ? '***' : 'НЕ УКАЗАН'}\n`);

async function testQuery() {
    console.log('🔍 Тестируем Query подключение...');
    try {
        const query = new mcQuery(config.host, config.queryPort);
        
        console.log('   📡 Получаем базовую статистику...');
        const basicStat = await query.basicStat();
        
        console.log('   ✅ Query подключение успешно!');
        console.log(`   📊 Сервер: ${basicStat.version}`);
        console.log(`   👥 Игроки: ${basicStat.onlinePlayers}/${basicStat.maxPlayers}`);
        console.log(`   📝 MOTD: ${basicStat.motd}`);
        
        try {
            console.log('   📡 Получаем полную статистику...');
            const fullStat = await query.fullStat();
            console.log(`   🗺️ Карта: ${fullStat.map || 'Unknown'}`);
            
            if (fullStat.players && fullStat.players.length > 0) {
                console.log(`   👤 Игроки онлайн: ${fullStat.players.join(', ')}`);
            }
        } catch (err) {
            console.log('   ⚠️ Полная статистика недоступна (это нормально)');
        }
        
        return true;
    } catch (error) {
        console.log('   ❌ Query подключение failed:');
        console.log(`   📄 Ошибка: ${error.message}`);
        return false;
    }
}

async function testRcon() {
    console.log('\n🎛️ Тестируем RCON подключение...');
    
    if (!config.rconPassword) {
        console.log('   ❌ RCON пароль не указан!');
        console.log('   💡 Добавьте RCON_PASSWORD в .env файл');
        return false;
    }
    
    try {
        console.log('   🔐 Подключаемся к RCON...');
        const rcon = await Rcon.connect({
            host: config.host,
            port: config.rconPort,
            password: config.rconPassword
        });
        
        console.log('   ✅ RCON подключение успешно!');
        
        // Тестируем несколько команд
        const commands = ['list', 'tps', 'version'];
        
        for (const command of commands) {
            try {
                console.log(`   ⌨️ Выполняем команду: ${command}`);
                const response = await rcon.send(command);
                console.log(`   📝 Ответ: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`);
            } catch (err) {
                console.log(`   ⚠️ Команда ${command} не выполнена: ${err.message}`);
            }
        }
        
        await rcon.end();
        console.log('   🔚 RCON соединение закрыто');
        return true;
        
    } catch (error) {
        console.log('   ❌ RCON подключение failed:');
        console.log(`   📄 Ошибка: ${error.message}`);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('   💡 Проверьте:');
            console.log('      - Включен ли RCON в server.properties');
            console.log('      - Правильный ли RCON порт');
            console.log('      - Открыт ли порт в файерволе');
        } else if (error.message.includes('Authentication failed')) {
            console.log('   💡 Проверьте RCON пароль в .env файле');
        }
        
        return false;
    }
}

async function testPing() {
    console.log('\n🏓 Тестируем базовую доступность сервера...');
    
    try {
        const { spawn } = require('child_process');
        
        return new Promise((resolve) => {
            // Используем системную команду ping
            const isWindows = process.platform === 'win32';
            const pingCmd = isWindows ? 'ping' : 'ping';
            const pingArgs = isWindows ? ['-n', '1', config.host] : ['-c', '1', config.host];
            
            const ping = spawn(pingCmd, pingArgs);
            
            ping.on('close', (code) => {
                if (code === 0) {
                    console.log('   ✅ Сервер доступен по сети');
                    resolve(true);
                } else {
                    console.log('   ❌ Сервер недоступен по сети');
                    console.log('   💡 Проверьте IP адрес и сетевое подключение');
                    resolve(false);
                }
            });
            
            ping.on('error', (err) => {
                console.log('   ⚠️ Не удалось выполнить ping');
                resolve(false);
            });
        });
    } catch (error) {
        console.log('   ⚠️ Ping тест недоступен');
        return false;
    }
}

async function runTests() {
    console.log('🚀 Начинаем тестирование...\n');
    
    const results = {
        ping: await testPing(),
        query: await testQuery(),
        rcon: await testRcon()
    };
    
    console.log('\n📊 Результаты тестирования:');
    console.log('═══════════════════════════');
    console.log(`🏓 Ping:  ${results.ping ? '✅ Работает' : '❌ Не работает'}`);
    console.log(`🔍 Query: ${results.query ? '✅ Работает' : '❌ Не работает'}`);
    console.log(`🎛️ RCON:  ${results.rcon ? '✅ Работает' : '❌ Не работает'}`);
    
    console.log('\n💡 Рекомендации:');
    
    if (!results.ping) {
        console.log('❌ Проблемы с сетью:');
        console.log('   - Проверьте IP адрес сервера');
        console.log('   - Убедитесь что сервер запущен');
        console.log('   - Проверьте интернет соединение');
    }
    
    if (!results.query) {
        console.log('❌ Проблемы с Query:');
        console.log('   - Добавьте enable-query=true в server.properties');
        console.log('   - Проверьте query.port в server.properties');
        console.log('   - Перезапустите Minecraft сервер');
    }
    
    if (!results.rcon) {
        console.log('❌ Проблемы с RCON:');
        console.log('   - Добавьте enable-rcon=true в server.properties');
        console.log('   - Установите rcon.password в server.properties');
        console.log('   - Проверьте rcon.port в server.properties');
        console.log('   - Обновите RCON_PASSWORD в .env файле');
        console.log('   - Перезапустите Minecraft сервер');
    }
    
    if (results.query && results.rcon) {
        console.log('🎉 Отлично! Все подключения работают');
        console.log('🚀 Можно запускать API сервер: npm start');
    } else if (results.query) {
        console.log('⚠️ Частично работает - только мониторинг');
        console.log('💡 Настройте RCON для полной функциональности');
    }
    
    console.log('\n📄 Для настройки сервера смотрите SETUP_INSTRUCTIONS.md');
}

// Запускаем тесты
runTests().catch(console.error);