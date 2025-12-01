require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Rcon } = require('rcon-client');
const mcQuery = require('mcquery');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Конфигурация сервера Minecraft
const SERVER_CONFIG = {
    host: process.env.MC_HOST || 'your-server-ip',
    port: parseInt(process.env.MC_PORT) || 25565,
    rconPort: parseInt(process.env.RCON_PORT) || 25575,
    rconPassword: process.env.RCON_PASSWORD || 'your-rcon-password',
    queryPort: parseInt(process.env.QUERY_PORT) || 25565
};

let rcon = null;

// Подключение к RCON
async function connectRcon() {
    try {
        if (rcon && !rcon.socket.destroyed) {
            return rcon;
        }
        
        rcon = await Rcon.connect({
            host: SERVER_CONFIG.host,
            port: SERVER_CONFIG.rconPort,
            password: SERVER_CONFIG.rconPassword
        });
        
        console.log('✅ RCON подключен успешно');
        return rcon;
    } catch (error) {
        console.error('❌ Ошибка подключения RCON:', error.message);
        return null;
    }
}

// ===== API ENDPOINTS =====

// Статус сервера (исправленный)
app.get('/api/status', async (req, res) => {
    try {
        // Пытаемся получить статус через RCON
        const rconClient = await connectRcon();
        if (rconClient) {
            try {
                const listResponse = await rconClient.send('list');
                
                // Парсим ответ команды /list (улучшенный парсинг)
                console.log('Raw list response:', listResponse);
                
                // Ищем игроков в конце строки после двоеточия или точки
                let playerList = [];
                let onlineCount = 0;
                let maxCount = 20; // по умолчанию
                
                // Разделяем ответ на строки
                const lines = listResponse.split('\n');
                for (const line of lines) {
                    // Ищем строку с именем игрока после двоеточия
                    if (line.includes(':') && !line.includes('игрок') && !line.includes('строк')) {
                        const parts = line.split(':');
                        if (parts.length > 1) {
                            const playerName = parts[1].trim();
                            if (playerName && playerName.length > 0 && !playerName.includes('с')) {
                                playerList.push(playerName);
                            }
                        }
                    }
                }
                
                onlineCount = playerList.length;
                
                // Если нашли игроков или есть указание на их количество, формируем ответ
                if (onlineCount > 0 || listResponse.includes('игрок') || listResponse.includes('player')) {
                    return res.json({
                        online: true,
                        players: {
                            online: onlineCount,
                            max: maxCount,
                            list: playerList
                        },
                        version: 'Minecraft Server',
                        motd: 'Server Online',
                        source: 'rcon'
                    });
                }
            } catch (rconError) {
                console.log('RCON list failed:', rconError.message);
            }
        }
        
        // Fallback: просто проверяем доступность сервера
        res.json({
            online: true,
            players: {
                online: 0,
                max: 20,
                list: []
            },
            version: 'Unknown',
            motd: 'Server Status Unknown',
            source: 'fallback',
            note: 'Limited info - RCON or Query unavailable'
        });
        
    } catch (error) {
        res.json({
            online: false,
            error: error.message,
            source: 'error'
        });
    }
});

// Список игроков
app.get('/api/players', async (req, res) => {
    try {
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        const response = await rconClient.send('list');
        
        // Парсим ответ от команды /list (улучшенный парсинг)
        console.log('Raw players response:', response);
        
        // Ищем игроков в ответе
        let playerList = [];
        let onlineCount = 0;
        let maxCount = 20; // по умолчанию
        
        // Разделяем ответ на строки
        const lines = response.split('\n');
        for (const line of lines) {
            // Ищем строку с именем игрока после двоеточия
            if (line.includes(':') && !line.includes('игрок') && !line.includes('строк')) {
                const parts = line.split(':');
                if (parts.length > 1) {
                    const playerName = parts[1].trim();
                    if (playerName && playerName.length > 0 && !playerName.includes('с')) {
                        playerList.push(playerName);
                    }
                }
            }
        }
        
        onlineCount = playerList.length;
        
        res.json({
            online: onlineCount,
            max: maxCount,
            players: playerList
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Выполнение команды
app.post('/api/command', async (req, res) => {
    try {
        const { command } = req.body;
        if (!command) {
            return res.status(400).json({ error: 'Команда не указана' });
        }
        
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        const response = await rconClient.send(command);
        res.json({ 
            success: true, 
            response: response || 'Команда выполнена успешно',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Кик игрока
app.post('/api/kick', async (req, res) => {
    try {
        const { player, reason = 'Исключен администратором' } = req.body;
        if (!player) {
            return res.status(400).json({ error: 'Не указан игрок' });
        }
        
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        const response = await rconClient.send(`kick ${player} ${reason}`);
        res.json({ 
            success: true, 
            message: `Игрок ${player} исключен`,
            response 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Бан игрока
app.post('/api/ban', async (req, res) => {
    try {
        const { player, reason = 'Заблокирован администратором' } = req.body;
        if (!player) {
            return res.status(400).json({ error: 'Не указан игрок' });
        }
        
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        const response = await rconClient.send(`ban ${player} ${reason}`);
        res.json({ 
            success: true, 
            message: `Игрок ${player} заблокирован`,
            response 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Разбан игрока
app.post('/api/unban', async (req, res) => {
    try {
        const { player } = req.body;
        if (!player) {
            return res.status(400).json({ error: 'Не указан игрок' });
        }
        
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        const response = await rconClient.send(`pardon ${player}`);
        res.json({ 
            success: true, 
            message: `Игрок ${player} разблокирован`,
            response 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Сохранение мира
app.post('/api/save', async (req, res) => {
    try {
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        await rconClient.send('save-all');
        res.json({ 
            success: true, 
            message: 'Мир сохранен успешно' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Остановка сервера
app.post('/api/stop', async (req, res) => {
    try {
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        await rconClient.send('stop');
        res.json({ 
            success: true, 
            message: 'Сервер останавливается...' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Отправка сообщения всем
app.post('/api/broadcast', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Сообщение не указано' });
        }
        
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        const response = await rconClient.send(`say ${message}`);
        res.json({ 
            success: true, 
            message: 'Сообщение отправлено',
            response 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Получение TPS и производительности с Spark
app.get('/api/performance', async (req, res) => {
    try {
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        // Пытаемся использовать команды Spark для подробного мониторинга
        const [tpsResponse, memoryResponse, gcResponse] = await Promise.allSettled([
            rconClient.send('spark tps'),
            rconClient.send('spark gc'),
            rconClient.send('spark gcmonitor --stop') // Остановим мониторинг GC если он работал
        ]);
        
        let performanceData = {
            timestamp: new Date().toISOString(),
            source: 'unknown'
        };
        
        // Пытаемся парсить Spark TPS
        if (tpsResponse.status === 'fulfilled' && tpsResponse.value) {
            const sparkTps = parseSparkTps(tpsResponse.value);
            if (sparkTps) {
                performanceData = { ...performanceData, ...sparkTps, source: 'spark' };
            }
        }
        
        // Пытаемся парсить Spark память
        if (memoryResponse.status === 'fulfilled' && memoryResponse.value) {
            const sparkMemory = parseSparkMemory(memoryResponse.value);
            if (sparkMemory) {
                performanceData = { ...performanceData, ...sparkMemory };
            }
        }
        
        // Fallback на стандартную команду TPS если Spark недоступен
        if (performanceData.source === 'unknown') {
            try {
                const fallbackTps = await rconClient.send('tps');
                
                // Улучшенный парсинг TPS - извлекаем все числа и берем подходящие
                let tps = 20.0;
                const numbers = fallbackTps.match(/(\d+\.?\d*)/g);
                if (numbers && numbers.length > 0) {
                    // Ищем числа в диапазоне TPS (0-20)
                    const validTps = numbers.map(n => parseFloat(n)).filter(n => n >= 0 && n <= 20);
                    if (validTps.length > 0) {
                        tps = validTps[validTps.length - 1]; // Берем последний валидный TPS
                    }
                }
                
                performanceData = {
                    tps,
                    timestamp: new Date().toISOString(),
                    raw_response: fallbackTps,
                    source: 'fallback'
                };
            } catch (fallbackError) {
                performanceData.error = 'Не удалось получить TPS';
                performanceData.tps = null;
            }
        }
        
        res.json(performanceData);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            tps: null,
            timestamp: new Date().toISOString()
        });
    }
});

// Spark профилирование CPU
app.post('/api/spark/profile-cpu', async (req, res) => {
    try {
        const { duration = 60 } = req.body;
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        const response = await rconClient.send(`spark profiler --timeout ${duration}`);
        res.json({ 
            success: true, 
            message: `CPU профилирование запущено на ${duration} секунд`,
            response 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Spark анализ памяти
app.post('/api/spark/heap-summary', async (req, res) => {
    try {
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        const response = await rconClient.send('spark heapsummary');
        const heapData = parseSparkHeapSummary(response);
        
        res.json({ 
            success: true, 
            heap_data: heapData,
            raw_response: response 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Spark мониторинг тиков
app.post('/api/spark/tick-monitoring', async (req, res) => {
    try {
        const { threshold = 50 } = req.body; // Миллисекунды
        const rconClient = await connectRcon();
        if (!rconClient) {
            throw new Error('RCON недоступен');
        }
        
        const response = await rconClient.send(`spark tickmonitor --threshold ${threshold} --without-gc`);
        res.json({ 
            success: true, 
            message: `Мониторинг тиков запущен (порог: ${threshold}ms)`,
            response 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Функции парсинга Spark данных
function parseSparkTps(sparkOutput) {
    try {
        // Парсим вывод команды "spark tps"
        const lines = sparkOutput.split('\n');
        let tpsData = {};
        
        for (const line of lines) {
            // TPS за последние периоды
            if (line.includes('TPS from last')) {
                const match = line.match(/TPS from last.*?:?\s*([\d.,\s]+)/);
                if (match) {
                    const values = match[1].split(/[,\s]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                    if (values.length >= 3) {
                        tpsData.tps = values[0]; // Последний TPS
                        tpsData.tps_1m = values[0];
                        tpsData.tps_5m = values[1];
                        tpsData.tps_15m = values[2];
                    }
                }
            }
            
            // MSPT (миллисекунды на тик)
            if (line.includes('MSPT')) {
                const match = line.match(/MSPT.*?:?\s*([\d.,\s]+)/);
                if (match) {
                    const values = match[1].split(/[,\s]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                    if (values.length >= 1) {
                        tpsData.mspt = values[0];
                    }
                }
            }
        }
        
        return Object.keys(tpsData).length > 0 ? tpsData : null;
    } catch (error) {
        console.error('Ошибка парсинга Spark TPS:', error);
        return null;
    }
}

function parseSparkMemory(sparkOutput) {
    try {
        // Парсим вывод команды "spark gc"
        const lines = sparkOutput.split('\n');
        let memoryData = {};
        
        for (const line of lines) {
            if (line.includes('Memory usage')) {
                const match = line.match(/(\d+)MB.*?\/.*?(\d+)MB/);
                if (match) {
                    memoryData.memory_used = parseInt(match[1]);
                    memoryData.memory_total = parseInt(match[2]);
                    memoryData.memory_percent = Math.round((memoryData.memory_used / memoryData.memory_total) * 100);
                }
            }
            
            if (line.includes('Collections')) {
                const gcMatch = line.match(/(\d+)\s+times/);
                if (gcMatch) {
                    memoryData.gc_collections = parseInt(gcMatch[1]);
                }
            }
        }
        
        return Object.keys(memoryData).length > 0 ? memoryData : null;
    } catch (error) {
        console.error('Ошибка парсинга Spark Memory:', error);
        return null;
    }
}

function parseSparkHeapSummary(sparkOutput) {
    try {
        const lines = sparkOutput.split('\n');
        let heapData = {
            top_memory_usage: [],
            total_instances: 0,
            total_bytes: 0
        };
        
        for (const line of lines) {
            // Парсим строки с информацией о памяти
            const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)/);
            if (match) {
                heapData.top_memory_usage.push({
                    instances: parseInt(match[1]),
                    bytes: parseInt(match[2]),
                    class_name: match[3].trim()
                });
            }
        }
        
        return heapData;
    } catch (error) {
        console.error('Ошибка парсинга Spark Heap:', error);
        return null;
    }
}

// Здоровье API
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        server_config: {
            host: SERVER_CONFIG.host,
            port: SERVER_CONFIG.port,
            rcon_port: SERVER_CONFIG.rconPort
        }
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('❌ Ошибка:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Получен сигнал SIGTERM, закрытие сервера...');
    if (rcon && !rcon.socket.destroyed) {
        rcon.end();
    }
    process.exit(0);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Backend API запущен на порту ${PORT}`);
    console.log(`🎮 Minecraft сервер: ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
    console.log(`🎛️ RCON порт: ${SERVER_CONFIG.rconPort}`);
    
    // Тестируем подключение при запуске
    connectRcon().then(connection => {
        if (connection) {
            console.log('✅ Начальное подключение к RCON успешно');
        } else {
            console.log('⚠️ Не удалось подключиться к RCON при запуске');
        }
    });
});

module.exports = app;