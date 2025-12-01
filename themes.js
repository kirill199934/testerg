// ===== СИСТЕМА УПРАВЛЕНИЯ ТЕМАМИ =====

// Список доступных тем
const themes = {
    'default': {
        name: 'Киберпанк',
        description: 'Классический дизайн',
        icon: '🌌'
    },
    'neon-purple': {
        name: 'Неон Пурпур', 
        description: 'Фиолетовое свечение',
        icon: '💜'
    },
    'matrix': {
        name: 'Матрица',
        description: 'Зеленый хакерский стиль',
        icon: '💚'
    },
    'ocean': {
        name: 'Океан',
        description: 'Голубые глубины',
        icon: '🌊'
    },
    'sunset': {
        name: 'Закат',
        description: 'Оранжевое тепло',
        icon: '🌅'
    },
    'retro-pink': {
        name: 'Ретро Пинк',
        description: 'Розовая волна',
        icon: '💖'
    }
};

let currentTheme = 'default';

// ===== ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ ТЕМ =====
function initThemeSystem() {
    console.log('🎨 Инициализация системы тем...');
    
    // Загружаем сохраненную тему
    loadSavedTheme();
    
    // Настраиваем обработчики
    setupThemeHandlers();
    
    // Применяем тему к body
    applyThemeTransitions();
    
    console.log('✅ Система тем инициализирована');
}

// ===== ЗАГРУЗКА СОХРАНЕННОЙ ТЕМЫ =====
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('travhouse_theme');
    if (savedTheme && themes[savedTheme]) {
        currentTheme = savedTheme;
        applyTheme(savedTheme, false); // Без анимации при загрузке
        updateActiveThemeOption();
        console.log(`🎨 Загружена тема: ${themes[savedTheme].name}`);
    }
}

// ===== НАСТРОЙКА ОБРАБОТЧИКОВ =====
function setupThemeHandlers() {
    // Кнопка открытия меню тем
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', openThemeSelector);
    }
    
    // Обработчики для каждой темы
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const themeName = option.getAttribute('data-theme');
            selectTheme(themeName);
        });
        
        // Hover эффекты
        option.addEventListener('mouseenter', () => {
            playHoverSound();
        });
    });
    
    // Закрытие по клику вне меню
    document.addEventListener('click', (e) => {
        const themeSelector = document.getElementById('themeSelector');
        if (e.target === themeSelector) {
            closeThemeSelector();
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeThemeSelector();
        }
    });
}

// ===== ПРИМЕНЕНИЕ АНИМАЦИЙ ПЕРЕХОДА =====
function applyThemeTransitions() {
    document.body.classList.add('theme-transition');
    
    // Применяем переходы к основным элементам
    const elementsToAnimate = [
        '.header', '.hero-section', '.form-container', 
        '.builds-container', '.footer', '.nav-link',
        '.build-item', '.server-title'
    ];
    
    elementsToAnimate.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.classList.add('theme-transition'));
    });
}

// ===== ОТКРЫТИЕ СЕЛЕКТОРА ТЕМ =====
function openThemeSelector() {
    const selector = document.getElementById('themeSelector');
    selector.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    playClickSound();
    
    // Анимация появления опций тем
    const options = document.querySelectorAll('.theme-option');
    options.forEach((option, index) => {
        option.style.animation = `slideInThemeOption 0.3s ease ${index * 0.1}s both`;
    });
    
    console.log('🎨 Открыто меню выбора тем');
}

// ===== ЗАКРЫТИЕ СЕЛЕКТОРА ТЕМ =====
function closeThemeSelector() {
    const selector = document.getElementById('themeSelector');
    selector.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    console.log('🎨 Закрыто меню выбора тем');
}

// ===== ВЫБОР ТЕМЫ =====
function selectTheme(themeName) {
    if (!themes[themeName]) {
        console.error('❌ Неизвестная тема:', themeName);
        return;
    }
    
    if (currentTheme === themeName) {
        console.log('🎨 Тема уже активна:', themes[themeName].name);
        closeThemeSelector();
        return;
    }
    
    console.log(`🎨 Переключение на тему: ${themes[themeName].name}`);
    
    // Применяем тему с анимацией
    applyTheme(themeName, true);
    
    // Сохраняем выбор
    currentTheme = themeName;
    localStorage.setItem('travhouse_theme', themeName);
    
    // Обновляем активную опцию
    updateActiveThemeOption();
    
    // Показываем уведомление
    showThemeNotification(themes[themeName]);
    
    // Закрываем меню с задержкой для плавности
    setTimeout(() => {
        closeThemeSelector();
    }, 800);
    
    playClickSound();
}

// ===== ПРИМЕНЕНИЕ ТЕМЫ =====
function applyTheme(themeName, withAnimation = true) {
    const body = document.body;
    
    if (withAnimation) {
        // Добавляем эффект мерцания при смене
        body.style.filter = 'brightness(0.7)';
        
        setTimeout(() => {
            body.setAttribute('data-theme', themeName);
            body.style.filter = '';
            
            // Принудительно обновляем фоновые элементы
            updateBackgroundElements();
            
            // Обновляем частицы
            updateParticlesTheme();
            
            // Перезапускаем анимации
            restartAnimations();
            
        }, 200);
    } else {
        body.setAttribute('data-theme', themeName);
        updateBackgroundElements();
        updateParticlesTheme();
    }
}

// ===== ОБНОВЛЕНИЕ ФОНОВЫХ ЭЛЕМЕНТОВ =====
function updateBackgroundElements() {
    // Принудительно обновляем фон
    const minecraftBg = document.querySelector('.minecraft-bg');
    if (minecraftBg) {
        minecraftBg.style.display = 'none';
        setTimeout(() => {
            minecraftBg.style.display = 'block';
        }, 100);
    }
    
    // Обновляем все элементы с классами, которые должны реагировать на тему
    const elementsToUpdate = [
        '.header', '.main-header', '.builds-section', 
        '.form-container', '.footer', '.build-item',
        '.nav-link', '.theme-button', '.admin-button'
    ];
    
    elementsToUpdate.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            // Принудительно перерисовываем элемент
            element.style.display = 'none';
            element.offsetHeight; // Trigger reflow
            element.style.display = '';
        });
    });
    
    // Обновляем анимированные пути
    updateAnimatedPaths();
}

// ===== ОБНОВЛЕНИЕ ЧАСТИЦ ПОД ТЕМУ =====
function updateParticlesTheme() {
    // Перезапускаем систему частиц с новыми цветами
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        // Очищаем старые частицы
        particlesContainer.innerHTML = '';
        
        // Создаем новые частицы через короткое время
        setTimeout(() => {
            if (window.createParticles) {
                createParticles();
            }
        }, 300);
    }
}

// ===== ОБНОВЛЕНИЕ АНИМИРОВАННЫХ ПУТЕЙ =====
function updateAnimatedPaths() {
    const pathsContainer = document.getElementById('backgroundPaths');
    if (pathsContainer) {
        // Очищаем старые пути
        pathsContainer.innerHTML = '';
        
        // Создаем новые пути с новыми цветами
        setTimeout(() => {
            if (window.setupBackgroundPaths) {
                setupBackgroundPaths();
            }
        }, 500);
    }
}

// ===== ПЕРЕЗАПУСК АНИМАЦИЙ =====
function restartAnimations() {
    // Обновляем анимации заголовка
    const title = document.querySelector('.server-title');
    if (title) {
        title.style.animation = 'none';
        setTimeout(() => {
            title.style.animation = '';
        }, 100);
    }
    
    // Обновляем свечение элементов
    const glowElements = document.querySelectorAll('.neon-glow');
    glowElements.forEach(element => {
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = '';
        }, 100);
    });
}

// ===== ОБНОВЛЕНИЕ АКТИВНОЙ ОПЦИИ =====
function updateActiveThemeOption() {
    const options = document.querySelectorAll('.theme-option');
    options.forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-theme') === currentTheme) {
            option.classList.add('active');
        }
    });
}

// ===== УВЕДОМЛЕНИЕ О СМЕНЕ ТЕМЫ =====
function showThemeNotification(theme) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bg-card);
        color: var(--text-primary);
        border: 2px solid var(--accent-color);
        border-radius: 15px;
        padding: 20px 30px;
        z-index: 15000;
        text-align: center;
        box-shadow: 0 0 30px var(--shadow-color);
        animation: themeNotificationShow 1.5s ease both;
    `;
    
    notification.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 10px;">${theme.icon}</div>
        <div style="font-weight: bold; font-size: 18px;">${theme.name}</div>
        <div style="font-size: 14px; opacity: 0.8;">${theme.description}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'themeNotificationHide 0.5s ease both';
            setTimeout(() => {
                notification.parentNode.removeChild(notification);
            }, 500);
        }
    }, 1500);
}

// ===== ЗВУКОВЫЕ ЭФФЕКТЫ ДЛЯ ТЕМ =====
function playClickSound() {
    if (window.playClickSound) {
        window.playClickSound();
    }
}

function playHoverSound() {
    if (window.playSound && window.createMinecraftHoverSound) {
        const hoverSound = window.createMinecraftHoverSound();
        window.playSound(hoverSound);
    }
}

// ===== CSS АНИМАЦИИ (добавляем в head) =====
function addThemeAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInThemeOption {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        @keyframes themeNotificationShow {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.5);
            }
            50% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.1);
            }
            100% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
        
        @keyframes themeNotificationHide {
            from {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            to {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
        }
        
        .theme-option {
            transform-origin: center;
        }
        
        .theme-option:hover {
            animation: themeOptionHover 0.3s ease;
        }
        
        @keyframes themeOptionHover {
            0% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-8px) scale(1.05); }
            100% { transform: translateY(-5px) scale(1.02); }
        }
    `;
    document.head.appendChild(style);
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем анимации
    addThemeAnimations();
    
    // Инициализируем систему тем
    initThemeSystem();
});

// ===== ЭКСПОРТ ФУНКЦИЙ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ =====
window.openThemeSelector = openThemeSelector;
window.closeThemeSelector = closeThemeSelector;
window.selectTheme = selectTheme;
window.themes = themes;

// ===== ОТЛАДКА =====
window.THEME_DEBUG = {
    currentTheme,
    themes,
    applyTheme,
    loadSavedTheme
};

console.log('🎨 Система тем загружена!');