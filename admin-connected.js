// ===== АВТОРИЗАЦИЯ =====
function initAuth() {
    const loginScreen = document.getElementById('loginScreen');
    const adminPanel = document.getElementById('adminPanel');
    const loginForm = document.getElementById('loginForm');
    const adminPassword = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    // Всегда требуем ввод пароля - безопасность превыше всего
    // Убираем проверку сохраненной сессии для повышенной безопасности

    // Обработка формы входа
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = adminPassword.value;
        
        if (password === ADMIN_PASSWORD) {
            // Успешная авторизация (без сохранения сессии для безопасности)
            showAdminPanel();
        } else {
            // Неверный пароль
            loginError.style.display = 'block';
            adminPassword.value = '';
            adminPassword.style.borderColor = '#ff4444';
            
            // Убираем ошибку через 3 секунды
            setTimeout(() => {
                loginError.style.display = 'none';
                adminPassword.style.borderColor = 'rgba(0, 255, 255, 0.3)';
            }, 3000);
        }
    });

    // Кнопка выхода
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    function showAdminPanel() {
        isAuthenticated = true;
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'block';
        
        // Инициализируем админ-панель
        initializeAdminPanel();
    }

    function logout() {
        // Очищаем все данные авторизации
        isAuthenticated = false;
        loginScreen.style.display = 'flex';
        adminPanel.style.display = 'none';
        
        // Очищаем поле пароля для безопасности
        if (adminPassword) adminPassword.value = '';
        
        // Очищаем данные
        if (refreshInterval) clearInterval(refreshInterval);
        if (consoleUpdateInterval) clearInterval(consoleUpdateInterval);
    }
}

// ===== КОНФИГУРАЦИЯ API =====
const API_CONFIG = {
    baseURL: 'http://localhost:3000/api', // Временно обратно к RCON API
    timeout: 10000,
    retryAttempts: 3
};

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let isConnected = false;
let isAuthenticated = false;
const ADMIN_PASSWORD = "travhouse2024"; // Пароль для доступа к админ-панели
let refreshInterval = null;
let consoleUpdateInterval = null;

// ===== ИНИЦИАЛИЗАЦИЯ АДМИН-ПАНЕЛИ =====
function initializeAdminPanel() {
    console.log('🚀 Инициализация админ-панели...');
    
    // Настройка обработчиков
    setupEventHandlers();
    
    // Проверка подключения
    checkConnection();
    
    // Автообновление данных
    startAutoRefresh();
    
    // Приветственное сообщение
    updateConsole('[СИСТЕМА] Админ-панель загружена и готова к работе!');
    updateConsole('[СИСТЕМА] 🔑 Авторизация пройдена успешно');
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Загрузка админ-панели TravHouse...');
    
    // Сначала инициализируем авторизацию
    initAuth();
});

// ===== НАСТРОЙКА ОБРАБОТЧИКОВ =====
function setupEventHandlers() {
    // Выход из админки
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите выйти из админ-панели?')) {
            // Проверяем, открыта ли панель в iframe или модальном окне
            if (window.parent !== window) {
                // Админ-панель в iframe - закрываем через родительское окно
                window.parent.postMessage('closeAdminPanel', '*');
            } else {
                // Админ-панель открыта отдельно - возвращаемся к экрану авторизации
                isAuthenticated = false;
                loginScreen.style.display = 'flex';
                adminPanel.style.display = 'none';
                
                // Очищаем поле пароля для безопасности
                if (adminPassword) adminPassword.value = '';
                
                // Очищаем данные
                if (refreshInterval) clearInterval(refreshInterval);
                if (consoleUpdateInterval) clearInterval(consoleUpdateInterval);
            }
        }
    });

    // Обработка Enter в консоли
    document.getElementById('commandInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            executeConsoleCommand();
        }
    });
}

// ===== API ЗАПРОСЫ =====
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            timeout: API_CONFIG.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`❌ Ошибка API запроса к ${endpoint}:`, error);
        throw error;
    }
}

// ===== ПРОВЕРКА ПОДКЛЮЧЕНИЯ =====
async function checkConnection() {
    try {
        updateConnectionStatus('Проверка подключения...', 'connecting');
        
        // Проверяем здоровье API
        await apiRequest('/health');
        
        // Проверяем статус сервера
        const status = await getServerStatus();
        
        if (status) {
            updateConnectionStatus('Подключено', 'connected');
            isConnected = true;
            updateConsole('[СИСТЕМА] ✅ Подключение к серверу установлено');
        } else {
            throw new Error('Сервер недоступен');
        }
    } catch (error) {
        updateConnectionStatus('Не подключено', 'disconnected');
        isConnected = false;
        updateConsole(`[СИСТЕМА] ❌ Ошибка подключения: ${error.message}`);
        showErrorNotification('Ошибка подключения к серверу: ' + error.message);
    }
}

// ===== ОБНОВЛЕНИЕ СТАТУСА ПОДКЛЮЧЕНИЯ =====
function updateConnectionStatus(text, status) {
    const statusElement = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    const indicator = statusElement.querySelector('.status-indicator');
    
    statusText.textContent = text;
    
    // Убираем все классы статуса
    statusElement.classList.remove('connected', 'disconnected', 'connecting');
    indicator.classList.remove('status-online', 'status-offline', 'status-maintenance');
    
    // Добавляем нужный класс
    switch (status) {
        case 'connected':
            statusElement.classList.add('connected');
            indicator.classList.add('status-online');
            break;
        case 'disconnected':
            statusElement.classList.add('disconnected');
            indicator.classList.add('status-offline');
            break;
        case 'connecting':
            statusElement.classList.add('connecting');
            indicator.classList.add('status-maintenance');
            break;
    }
}

// ===== ПОЛУЧЕНИЕ СТАТУСА СЕРВЕРА =====
async function getServerStatus() {
    try {
        const data = await apiRequest('/status');
        
        // Обновляем UI с данными сервера
        if (data.online) {
            document.getElementById('serverStatus').innerHTML = 
                '<span class="status-indicator status-online"></span>Онлайн';
            document.getElementById('playersOnline').textContent = 
                `${data.players.online}/${data.players.max}`;
            document.getElementById('serverVersion').textContent = data.version || 'N/A';
            
            // Обновляем аптайм
            const uptimeElement = document.getElementById('uptime');
            if (uptimeElement && data.uptime !== undefined) {
                const hours = Math.floor(data.uptime / 3600);
                const minutes = Math.floor((data.uptime % 3600) / 60);
                
                if (hours > 0) {
                    uptimeElement.textContent = `${hours}ч ${minutes}м`;
                } else {
                    uptimeElement.textContent = `${minutes}м`;
                }
                
                // Цветовая индикация аптайма
                if (data.uptime < 300) { // < 5 минут
                    uptimeElement.style.color = '#ff8c00'; // Оранжевый
                } else if (data.uptime < 3600) { // < 1 час
                    uptimeElement.style.color = '#ffd700'; // Желтый
                } else {
                    uptimeElement.style.color = '#00ff00'; // Зеленый
                }
            }
            
            const connectionInfo = document.getElementById('connectionInfo');
            connectionInfo.textContent = `Подключено к серверу • ${data.players.online} игроков онлайн`;
        } else {
            document.getElementById('serverStatus').innerHTML = 
                '<span class="status-indicator status-offline"></span>Офлайн';
            document.getElementById('playersOnline').textContent = '0/0';
            document.getElementById('serverVersion').textContent = 'N/A';
            
            // Сброс аптайма при офлайне
            const uptimeElement = document.getElementById('uptime');
            if (uptimeElement) {
                uptimeElement.textContent = '-';
                uptimeElement.style.color = '#999';
            }
        }
        
        return data;
    } catch (error) {
        console.error('❌ Ошибка получения статуса сервера:', error);
        return null;
    }
}

// ===== ПОЛУЧЕНИЕ СПИСКА ИГРОКОВ =====
async function getPlayers() {
    try {
        const data = await apiRequest('/players');
        
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        if (data.players && data.players.length > 0) {
            // Добавляем заголовок со счетчиком
            const headerItem = document.createElement('div');
            headerItem.className = 'player-item';
            headerItem.style.fontWeight = 'bold';
            headerItem.style.borderBottom = '2px solid rgba(0, 255, 255, 0.3)';
            headerItem.innerHTML = `<span style="color: #00ffff;">👥 Игроков онлайн: ${data.players.length}</span>`;
            playersList.appendChild(headerItem);
            
            data.players.forEach((player, index) => {
                const playerItem = document.createElement('div');
                playerItem.className = 'player-item';
                playerItem.innerHTML = `
                    <span>🟢 ${index + 1}. ${player}</span>
                    <div>
                        <button class="action-btn btn-warning" onclick="kickPlayer('${player}')">Кик</button>
                        <button class="action-btn btn-danger" onclick="banPlayer('${player}')">Бан</button>
                    </div>
                `;
                playersList.appendChild(playerItem);
            });
            
            // Добавляем статистику
            const statsItem = document.createElement('div');
            statsItem.className = 'player-item';
            statsItem.style.fontSize = '0.9em';
            statsItem.style.color = '#999';
            statsItem.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
            statsItem.innerHTML = `<span>📊 Последнее обновление: ${new Date().toLocaleTimeString('ru-RU')}</span>`;
            playersList.appendChild(statsItem);
        } else {
            playersList.innerHTML = '<div class="player-item"><span>👤 Игроков онлайн нет</span></div>';
        }
    } catch (error) {
        console.error('❌ Ошибка получения списка игроков:', error);
        document.getElementById('playersList').innerHTML = 
            '<div class="error-message">Ошибка загрузки списка игроков</div>';
    }
}

// ===== ПОЛУЧЕНИЕ ДАННЫХ О ПРОИЗВОДИТЕЛЬНОСТИ С SPARK =====
async function getPerformanceData() {
    try {
        const data = await apiRequest('/performance');
        
        // Обновляем основной TPS
        if (data.tps !== null) {
            document.getElementById('tps').textContent = data.tps.toFixed(1);
            document.getElementById('tpsDetailed').textContent = data.tps.toFixed(1);
            
            // Цветовая индикация TPS
            const tpsElement = document.getElementById('tpsDetailed');
            if (data.tps >= 19.5) {
                tpsElement.style.color = '#00ff00'; // Зеленый
            } else if (data.tps >= 15.0) {
                tpsElement.style.color = '#ffd700'; // Желтый
            } else {
                tpsElement.style.color = '#ff4444'; // Красный
            }
        }
        
        // Обновляем расширенные данные Spark
        if (data.source === 'spark') {
            updateSparkData(data);
            updateConsole(`[SPARK] TPS: ${data.tps?.toFixed(1)} | MSPT: ${data.mspt?.toFixed(1)}ms | Memory: ${data.memory_percent}%`);
        } else {
            updateConsole(`[TPS] Текущий TPS: ${data.tps?.toFixed(1)} (источник: ${data.source})`);
        }
        
        // Обновляем данные о памяти
        if (data.memory_used && data.memory_total) {
            const memoryElement = document.getElementById('memoryUsage');
            if (memoryElement) {
                memoryElement.textContent = `${data.memory_used}/${data.memory_total}MB`;
                memoryElement.style.color = data.memory_percent > 80 ? '#ff4444' : 
                                           data.memory_percent > 60 ? '#ffd700' : '#00ff00';
            }
        }
        
        // Обновляем время последнего обновления
        const lastUpdateElement = document.getElementById('performanceLastUpdate');
        if (lastUpdateElement) {
            const now = new Date().toLocaleTimeString('ru-RU');
            lastUpdateElement.textContent = `📊 Последнее обновление: ${now}`;
        }
        
    } catch (error) {
        console.error('❌ Ошибка получения данных о производительности:', error);
        showErrorNotification('Ошибка получения данных TPS');
    }
}

// ===== ОБНОВЛЕНИЕ РАСШИРЕННЫХ ДАННЫХ SPARK =====
function updateSparkData(data) {
    // Обновляем TPS за разные периоды
    if (data.tps_1m !== undefined) {
        updateStatElement('tps1m', data.tps_1m.toFixed(1));
    }
    if (data.tps_5m !== undefined) {
        updateStatElement('tps5m', data.tps_5m.toFixed(1));
    }
    if (data.tps_15m !== undefined) {
        updateStatElement('tps15m', data.tps_15m.toFixed(1));
    }
    
    // Обновляем MSPT
    if (data.mspt !== undefined) {
        const msptElement = document.getElementById('mspt');
        if (msptElement) {
            msptElement.textContent = data.mspt.toFixed(1) + 'ms';
            
            // Цветовая индикация MSPT
            if (data.mspt <= 50) {
                msptElement.style.color = '#00ff00'; // Зеленый
            } else if (data.mspt <= 100) {
                msptElement.style.color = '#ffd700'; // Желтый
            } else {
                msptElement.style.color = '#ff4444'; // Красный
            }
        }
    }
    
    // Обновляем данные о сборке мусора
    if (data.gc_collections !== undefined) {
        updateStatElement('gcCollections', data.gc_collections);
    }
}

function updateStatElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// ===== SPARK ПРОФИЛИРОВАНИЕ =====
async function startSparkCpuProfile(duration = 60) {
    try {
        showInfoNotification(`Запуск CPU профилирования на ${duration} секунд...`);
        
        const data = await apiRequest('/spark/profile-cpu', {
            method: 'POST',
            body: JSON.stringify({ duration })
        });
        
        if (data.success) {
            showSuccessNotification(data.message);
            updateConsole(`[SPARK] ${data.message}`);
        }
    } catch (error) {
        showErrorNotification('Ошибка запуска профилирования: ' + error.message);
    }
}

async function getSparkHeapSummary() {
    try {
        showInfoNotification('Анализ использования памяти...');
        
        const data = await apiRequest('/spark/heap-summary', {
            method: 'POST'
        });
        
        if (data.success) {
            showSuccessNotification('Анализ памяти завершен');
            updateConsole('[SPARK] Анализ памяти:');
            
            if (data.heap_data?.top_memory_usage) {
                const topUsage = data.heap_data.top_memory_usage.slice(0, 5); // Топ 5
                topUsage.forEach((item, index) => {
                    updateConsole(`  ${index + 1}. ${item.class_name}: ${item.instances} экземпляров, ${(item.bytes / 1024 / 1024).toFixed(2)}MB`);
                });
            }
        }
    } catch (error) {
        showErrorNotification('Ошибка анализа памяти: ' + error.message);
    }
}

async function startSparkTickMonitoring(threshold = 50) {
    try {
        showInfoNotification(`Запуск мониторинга тиков (порог: ${threshold}ms)...`);
        
        const data = await apiRequest('/spark/tick-monitoring', {
            method: 'POST',
            body: JSON.stringify({ threshold })
        });
        
        if (data.success) {
            showWarningNotification(data.message);
            updateConsole(`[SPARK] ${data.message}`);
        }
    } catch (error) {
        showErrorNotification('Ошибка запуска мониторинга тиков: ' + error.message);
    }
}

// ===== ВЫПОЛНЕНИЕ КОМАНДЫ =====
async function executeCommand(command) {
    try {
        updateConsole(`> ${command}`);
        
        const data = await apiRequest('/command', {
            method: 'POST',
            body: JSON.stringify({ command })
        });
        
        if (data.success) {
            updateConsole(`${data.response}`);
            showSuccessNotification('Команда выполнена успешно');
        } else {
            updateConsole(`[ОШИБКА] ${data.error}`);
            showErrorNotification('Ошибка выполнения команды: ' + data.error);
        }
    } catch (error) {
        updateConsole(`[ОШИБКА] ${error.message}`);
        showErrorNotification('Ошибка выполнения команды: ' + error.message);
    }
}

// ===== ФУНКЦИИ УПРАВЛЕНИЯ ИГРОКАМИ =====
async function kickPlayer(playerName) {
    if (!confirm(`Кикнуть игрока ${playerName}?`)) return;
    
    try {
        const data = await apiRequest('/kick', {
            method: 'POST',
            body: JSON.stringify({ player: playerName })
        });
        
        if (data.success) {
            showWarningNotification(data.message);
            updateConsole(`[АДМИН] Игрок ${playerName} исключен с сервера`);
            refreshPlayers();
        }
    } catch (error) {
        showErrorNotification('Ошибка исключения игрока: ' + error.message);
    }
}

async function banPlayer(playerName) {
    if (!confirm(`Забанить игрока ${playerName}?`)) return;
    
    try {
        const data = await apiRequest('/ban', {
            method: 'POST',
            body: JSON.stringify({ player: playerName })
        });
        
        if (data.success) {
            showErrorNotification(data.message);
            updateConsole(`[АДМИН] Игрок ${playerName} заблокирован`);
            refreshPlayers();
        }
    } catch (error) {
        showErrorNotification('Ошибка блокировки игрока: ' + error.message);
    }
}

async function unbanPlayer(playerName) {
    if (!confirm(`Разбанить игрока ${playerName}?`)) return;
    
    try {
        const data = await apiRequest('/unban', {
            method: 'POST',
            body: JSON.stringify({ player: playerName })
        });
        
        if (data.success) {
            showSuccessNotification(data.message);
            updateConsole(`[АДМИН] Игрок ${playerName} разблокирован`);
        }
    } catch (error) {
        showErrorNotification('Ошибка разблокировки игрока: ' + error.message);
    }
}

async function banPlayerByName() {
    const input = document.getElementById('banInput');
    const playerName = input.value.trim();
    
    if (!playerName) {
        showWarningNotification('Введите никнейм игрока!');
        return;
    }
    
    await banPlayer(playerName);
    input.value = '';
}

// ===== ФУНКЦИИ УПРАВЛЕНИЯ СЕРВЕРОМ =====
async function saveWorld() {
    try {
        showInfoNotification('Сохранение мира...');
        
        const data = await apiRequest('/save', { method: 'POST' });
        
        if (data.success) {
            showSuccessNotification('Мир сохранен успешно!');
            updateConsole('[СЕРВЕР] Мир сохранен');
        }
    } catch (error) {
        showErrorNotification('Ошибка сохранения мира: ' + error.message);
    }
}

async function stopServer() {
    if (!confirm('ВНИМАНИЕ! Остановить сервер? Все игроки будут отключены!')) return;
    
    try {
        showWarningNotification('Остановка сервера...');
        
        const data = await apiRequest('/stop', { method: 'POST' });
        
        if (data.success) {
            showErrorNotification('Сервер остановлен!');
            updateConsole('[СЕРВЕР] Сервер остановлен');
            
            // Обновляем статус
            document.getElementById('serverStatus').innerHTML = 
                '<span class="status-indicator status-offline"></span>Офлайн';
        }
    } catch (error) {
        showErrorNotification('Ошибка остановки сервера: ' + error.message);
    }
}

async function restartServer() {
    if (!confirm('ВНИМАНИЕ! Перезагрузить сервер? Все игроки будут отключены!')) return;
    
    try {
        showWarningNotification('Перезагрузка сервера...');
        
        // Сначала сохраняем мир
        await apiRequest('/save', { method: 'POST' });
        
        // Затем останавливаем
        await apiRequest('/stop', { method: 'POST' });
        
        showInfoNotification('Сервер перезагружается... Это займет некоторое время.');
        updateConsole('[СЕРВЕР] Сервер перезагружается...');
        
        // Проверяем статус каждые 10 секунд
        const checkRestart = setInterval(async () => {
            const status = await getServerStatus();
            if (status && status.online) {
                clearInterval(checkRestart);
                showSuccessNotification('Сервер перезагружен и готов к работе!');
                updateConsole('[СЕРВЕР] Сервер перезагружен успешно');
                refreshAllData();
            }
        }, 10000);
        
    } catch (error) {
        showErrorNotification('Ошибка перезагрузки сервера: ' + error.message);
    }
}

async function broadcastMessage() {
    const message = prompt('Введите сообщение для всех игроков:');
    if (!message) return;
    
    try {
        const data = await apiRequest('/broadcast', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
        
        if (data.success) {
            showSuccessNotification('Сообщение отправлено всем игрокам!');
            updateConsole(`[СООБЩЕНИЕ] ${message}`);
        }
    } catch (error) {
        showErrorNotification('Ошибка отправки сообщения: ' + error.message);
    }
}

// ===== ФУНКЦИИ КОНСОЛИ =====
function handleCommand(event) {
    if (event.key === 'Enter') {
        executeConsoleCommand();
    }
}

function executeConsoleCommand() {
    const input = document.getElementById('commandInput');
    const command = input.value.trim();
    
    if (!command) return;
    
    // Обработка специальных команд для быстрого получения данных
    if (command.startsWith('/')) {
        handleSpecialCommand(command);
    } else {
        executeCommand(command);
    }
    
    input.value = '';
}

// ===== ОБРАБОТКА СПЕЦИАЛЬНЫХ КОМАНД =====
async function handleSpecialCommand(command) {
    const cmd = command.toLowerCase();
    
    updateConsole(`> ${command}`);
    
    // Проверяем подключение к серверу (кроме команды help)
    if (cmd !== '/help' && cmd !== '/?') {
        if (!isConnected) {
            updateConsole('[ОШИБКА] ❌ Нет подключения к серверу!');
            updateConsole('[СИСТЕМА] 🔄 Попробуйте обновить подключение кнопкой "Обновить всё"');
            return;
        }
        
        // Дополнительная проверка статуса сервера
        try {
            const serverStatus = await apiRequest('/health');
            if (!serverStatus) {
                updateConsole('[ОШИБКА] ❌ Сервер недоступен!');
                return;
            }
        } catch (error) {
            updateConsole('[ОШИБКА] ❌ Не удалось связаться с сервером!');
            updateConsole(`[ДЕТАЛИ] ${error.message}`);
            return;
        }
    }
    
    try {
        switch (cmd) {
            case '/tps':
                const tpsData = await apiRequest('/performance');
                if (tpsData.tps !== null) {
                    const tpsColor = tpsData.tps >= 19.5 ? '🟢' : tpsData.tps >= 15.0 ? '🟡' : '🔴';
                    updateConsole(`[TPS] ${tpsColor} Текущий TPS: ${tpsData.tps.toFixed(1)}`);
                    
                    if (tpsData.source === 'spark' && tpsData.tps_1m !== undefined) {
                        updateConsole(`[TPS] 📊 1м: ${tpsData.tps_1m.toFixed(1)} | 5м: ${tpsData.tps_5m?.toFixed(1) || 'N/A'} | 15м: ${tpsData.tps_15m?.toFixed(1) || 'N/A'}`);
                    }
                } else {
                    updateConsole('[TPS] ❌ Данные TPS недоступны');
                }
                break;
                
            case '/mspt':
                const msptData = await apiRequest('/performance');
                if (msptData.mspt !== null && msptData.mspt !== undefined) {
                    const msptColor = msptData.mspt <= 50 ? '🟢' : msptData.mspt <= 100 ? '🟡' : '🔴';
                    updateConsole(`[MSPT] ${msptColor} Время тика: ${msptData.mspt.toFixed(1)}ms`);
                    
                    // Рекомендации по MSPT
                    if (msptData.mspt > 100) {
                        updateConsole('[MSPT] ⚠️ Высокая задержка! Сервер может лагать');
                    } else if (msptData.mspt > 50) {
                        updateConsole('[MSPT] ⚠️ Повышенная нагрузка');
                    } else {
                        updateConsole('[MSPT] ✅ Отличная производительность');
                    }
                } else {
                    updateConsole('[MSPT] ❌ Данные MSPT недоступны');
                }
                break;
                
            case '/memory':
                const memoryData = await apiRequest('/performance');
                if (memoryData.memory_used && memoryData.memory_total) {
                    const memPercent = memoryData.memory_percent;
                    const memColor = memPercent > 80 ? '🔴' : memPercent > 60 ? '🟡' : '🟢';
                    
                    updateConsole(`[ПАМЯТЬ] ${memColor} Использовано: ${memoryData.memory_used}MB / ${memoryData.memory_total}MB (${memPercent}%)`);
                    
                    // Рекомендации по памяти
                    if (memPercent > 90) {
                        updateConsole('[ПАМЯТЬ] 🚨 КРИТИЧНО! Память почти закончилась');
                    } else if (memPercent > 80) {
                        updateConsole('[ПАМЯТЬ] ⚠️ Высокое потребление памяти');
                    } else if (memPercent > 60) {
                        updateConsole('[ПАМЯТЬ] ⚠️ Умеренное потребление памяти');
                    } else {
                        updateConsole('[ПАМЯТЬ] ✅ Память в норме');
                    }
                    
                    // Доступная память
                    const freeMemory = memoryData.memory_total - memoryData.memory_used;
                    updateConsole(`[ПАМЯТЬ] 📊 Свободно: ${freeMemory}MB`);
                } else {
                    updateConsole('[ПАМЯТЬ] ❌ Данные о памяти недоступны');
                }
                break;
                
            case '/online':
            case '/players':
                const playersData = await apiRequest('/players');
                const statusData = await apiRequest('/status');
                
                if (statusData && statusData.players) {
                    const onlineCount = statusData.players.online || 0;
                    const maxCount = statusData.players.max || 0;
                    const onlineColor = onlineCount > 0 ? '🟢' : '🔴';
                    
                    updateConsole(`[ОНЛАЙН] ${onlineColor} Игроков: ${onlineCount}/${maxCount}`);
                    
                    if (playersData && playersData.players && playersData.players.length > 0) {
                        updateConsole('[ИГРОКИ] 👥 Список онлайн:');
                        playersData.players.forEach((player, index) => {
                            updateConsole(`  ${index + 1}. 🟢 ${player}`);
                        });
                    } else if (onlineCount === 0) {
                        updateConsole('[ИГРОКИ] 👤 Никого нет онлайн');
                    }
                } else {
                    updateConsole('[ОНЛАЙН] ❌ Данные об игроках недоступны');
                }
                break;
                
            case '/version':
            case '/ver':
                const versionData = await apiRequest('/status');
                if (versionData) {
                    const version = versionData.version || 'Неизвестно';
                    const serverType = versionData.server_type || 'Minecraft Server';
                    updateConsole(`[ВЕРСИЯ] 🏷️ ${serverType}: ${version}`);
                    
                    if (versionData.online !== undefined) {
                        const statusColor = versionData.online ? '🟢' : '🔴';
                        const statusText = versionData.online ? 'Онлайн' : 'Офлайн';
                        updateConsole(`[СТАТУС] ${statusColor} Сервер: ${statusText}`);
                    }
                } else {
                    updateConsole('[ВЕРСИЯ] ❌ Информация о версии недоступна');
                }
                break;
                
            case '/uptime':
            case '/время':
                const uptimeData = await apiRequest('/status');
                if (uptimeData && uptimeData.uptime !== undefined) {
                    const uptime = uptimeData.uptime;
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);
                    const seconds = uptime % 60;
                    
                    let uptimeString = '';
                    if (hours > 0) uptimeString += `${hours}ч `;
                    if (minutes > 0) uptimeString += `${minutes}м `;
                    uptimeString += `${seconds}с`;
                    
                    updateConsole(`[АПТАЙМ] ⏰ Сервер работает: ${uptimeString}`);
                    
                    // Дополнительная информация
                    if (hours > 24) {
                        const days = Math.floor(hours / 24);
                        const remainingHours = hours % 24;
                        updateConsole(`[АПТАЙМ] 📅 Это ${days} дн. ${remainingHours}ч`);
                    }
                    
                    if (uptime < 300) { // меньше 5 минут
                        updateConsole('[АПТАЙМ] 🆕 Сервер недавно перезапущен');
                    }
                } else {
                    updateConsole('[АПТАЙМ] ❌ Данные об аптайме недоступны');
                }
                break;
                
            case '/status':
            case '/статус':
                // Комплексная информация о сервере
                updateConsole('[СТАТУС] 📊 Получение полной информации...');
                
                const [serverData, performanceData, playersInfo] = await Promise.all([
                    apiRequest('/status').catch(() => null),
                    apiRequest('/performance').catch(() => null),
                    apiRequest('/players').catch(() => null)
                ]);
                
                if (serverData) {
                    // Основная информация
                    const statusColor = serverData.online ? '🟢' : '🔴';
                    updateConsole(`[СТАТУС] ${statusColor} Сервер: ${serverData.online ? 'Онлайн' : 'Офлайн'}`);
                    updateConsole(`[ВЕРСИЯ] 🏷️ ${serverData.server_type || 'Minecraft'}: ${serverData.version || 'N/A'}`);
                    
                    // Игроки
                    const online = serverData.players?.online || 0;
                    const max = serverData.players?.max || 0;
                    updateConsole(`[ИГРОКИ] 👥 Онлайн: ${online}/${max}`);
                    
                    // Аптайм
                    if (serverData.uptime !== undefined) {
                        const hours = Math.floor(serverData.uptime / 3600);
                        const minutes = Math.floor((serverData.uptime % 3600) / 60);
                        updateConsole(`[АПТАЙМ] ⏰ ${hours}ч ${minutes}м`);
                    }
                }
                
                if (performanceData) {
                    // Производительность
                    if (performanceData.tps !== null) {
                        const tpsColor = performanceData.tps >= 19.5 ? '🟢' : performanceData.tps >= 15.0 ? '🟡' : '🔴';
                        updateConsole(`[TPS] ${tpsColor} ${performanceData.tps.toFixed(1)}`);
                    }
                    
                    if (performanceData.memory_percent !== undefined) {
                        const memColor = performanceData.memory_percent > 80 ? '🔴' : performanceData.memory_percent > 60 ? '🟡' : '🟢';
                        updateConsole(`[ПАМЯТЬ] ${memColor} ${performanceData.memory_percent}%`);
                    }
                }
                
                updateConsole('[СТАТУС] ✅ Информация обновлена');
                break;

            case '/help':
            case '/?':
                updateConsole('[СПРАВКА] Доступные команды:');
                updateConsole('  /tps       - Показать текущий TPS сервера');
                updateConsole('  /mspt      - Показать время выполнения тика');
                updateConsole('  /memory    - Показать использование памяти');
                updateConsole('  /online    - Список игроков онлайн');
                updateConsole('  /version   - Версия и тип сервера');
                updateConsole('  /uptime    - Время работы сервера');
                updateConsole('  /status    - Полная информация о сервере');
                updateConsole('  /help      - Показать эту справку');
                updateConsole('  Любая другая команда будет отправлена на сервер');
                break;
                
            default:
                updateConsole(`[ОШИБКА] Неизвестная команда: ${command}`);
                updateConsole('[СПРАВКА] Введите /help для списка команд');
                break;
        }
    } catch (error) {
        updateConsole(`[ОШИБКА] Не удалось выполнить команду: ${error.message}`);
    }
}

function clearConsole() {
    document.getElementById('consoleOutput').innerHTML = '';
}

function updateConsole(message) {
    const console = document.getElementById('consoleOutput');
    const timestamp = new Date().toLocaleTimeString('ru-RU');
    console.innerHTML += `[${timestamp}] ${message}<br>`;
    console.scrollTop = console.scrollHeight;
}

// ===== ФУНКЦИИ ОБНОВЛЕНИЯ =====
function refreshConnection() {
    checkConnection();
}

async function refreshPlayers() {
    await getPlayers();
}

async function refreshStats() {
    await getServerStatus();
    await getPerformanceData();
}

async function refreshAllData() {
    // Показываем уведомление о начале обновления
    showInfoNotification('🔄 Обновление всех данных сервера...');
    
    try {
        // Обновляем статус подключения
        updateConnectionStatus('Обновление...', 'connecting');
        
        // Выполняем все обновления параллельно для скорости
        const results = await Promise.allSettled([
            checkConnection(),
            getServerStatus(),
            getPlayers(),
            getPerformanceData()
        ]);
        
        // Проверяем результаты
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        if (successful > 0) {
            showSuccessNotification(`✅ Обновлено! Успешно: ${successful}, ошибок: ${failed}`);
            updateConsole(`[СИСТЕМА] Данные обновлены: ${successful} успешно, ${failed} ошибок`);
        } else {
            showErrorNotification('❌ Ошибка обновления всех данных');
        }
        
        // Обновляем статус подключения
        if (isConnected) {
            updateConnectionStatus('Подключено', 'connected');
        } else {
            updateConnectionStatus('Не подключено', 'disconnected');
        }
        
    } catch (error) {
        console.error('❌ Ошибка полного обновления:', error);
        showErrorNotification('Ошибка при обновлении данных: ' + error.message);
    }
}

// ===== АВТООБНОВЛЕНИЕ =====
function startAutoRefresh() {
    // Обновляем статистику каждые 30 секунд
    refreshInterval = setInterval(refreshStats, 30000);
    
    // Обновляем список игроков каждую минуту
    setInterval(refreshPlayers, 60000);
    
    console.log('🔄 Автообновление запущено');
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    console.log('🛑 Автообновление остановлено');
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
        info: 'linear-gradient(145deg, rgba(58, 58, 80, 0.95), rgba(42, 42, 74, 0.9))',
        success: 'linear-gradient(145deg, #00ff00, #00cc00)',
        warning: 'linear-gradient(145deg, #ffd700, #ff8c00)',
        error: 'linear-gradient(145deg, #ff4444, #cc0000)'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        border: 1px solid rgba(0, 255, 255, 0.3);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        max-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function showSuccessNotification(message) {
    showNotification(message, 'success');
}

function showErrorNotification(message) {
    showNotification(message, 'error');
}

function showWarningNotification(message) {
    showNotification(message, 'warning');
}

function showInfoNotification(message) {
    showNotification(message, 'info');
}

// ===== ОЧИСТКА ПРИ ВЫХОДЕ =====
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
    // Очищаем данные авторизации при закрытии страницы для безопасности
    isAuthenticated = false;
});

// ===== ДОПОЛНИТЕЛЬНАЯ БЕЗОПАСНОСТЬ =====
// Автоматический выход при потере фокуса страницы (опционально)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Страница скрыта - можно добавить таймер автовыхода
        console.log('🔒 Страница скрыта - админ-панель может быть заблокирована');
    }
});

// ===== ЭКСПОРТ ДЛЯ ОТЛАДКИ =====
window.ADMIN_DEBUG = {
    checkConnection,
    getServerStatus,
    getPlayers,
    executeCommand,
    refreshAllData,
    API_CONFIG
};

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML =====
window.refreshAllData = refreshAllData;
window.kickPlayer = kickPlayer;
window.banPlayer = banPlayer;
window.saveWorld = saveWorld;
window.stopServer = stopServer;
window.restartServer = restartServer;
window.broadcastMessage = broadcastMessage;
window.refreshConnection = refreshConnection;
window.refreshPlayers = refreshPlayers;
window.refreshStats = refreshStats;
window.clearConsole = clearConsole;
window.executeConsoleCommand = executeConsoleCommand;
window.handleCommand = handleCommand;
window.handleSpecialCommand = handleSpecialCommand;
window.banPlayerByName = banPlayerByName;
window.startSparkCpuProfile = startSparkCpuProfile;
window.getSparkHeapSummary = getSparkHeapSummary;
window.startSparkTickMonitoring = startSparkTickMonitoring;