// ===== ОСНОВНЫЕ ПЕРЕМЕННЫЕ =====

// Глобальная обработка ошибок
window.addEventListener('error', (event) => {
    // Игнорируем ошибки от браузерных расширений
    if (event.filename && (
        event.filename.includes('extension://') || 
        event.filename.includes('moz-extension://') ||
        event.filename.includes('safari-extension://')
    )) {
        event.preventDefault();
        return false;
    }
    
    // Игнорируем специфические ошибки расширений
    if (event.message && (
        event.message.includes('message channel closed') ||
        event.message.includes('Extension context invalidated') ||
        event.message.includes('Cannot access contents of')
    )) {
        event.preventDefault();
        return false;
    }
});

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
    // Игнорируем ошибки от браузерных расширений
    if (event.reason && event.reason.message && (
        event.reason.message.includes('message channel closed') ||
        event.reason.message.includes('Extension context invalidated')
    )) {
        event.preventDefault();
        return false;
    }
});

// Подавление console.error для специфических ошибок
const originalConsoleError = console.error;
console.error = function(...args) {
    const message = args.join(' ');
    
    // Игнорируем ошибки расширений и блокировщиков рекламы
    if (message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
        message.includes('message channel closed') ||
        message.includes('Extension context invalidated')) {
        return;
    }
    
    // Вызываем оригинальный console.error для остальных ошибок
    originalConsoleError.apply(console, args);
};
let form, submitButton, inputs, newsModal;

// ===== АДМИН-ПАНЕЛЬ =====
function initAdminPanel() {
    const adminButton = document.getElementById('openAdminPanel');
    const adminModal = document.getElementById('adminModal');
    const adminClose = document.querySelector('.admin-close');
    const adminFrame = document.getElementById('adminFrame');
    
    console.log('🔧 Инициализация админ-панели...');
    console.log('adminButton:', adminButton);
    console.log('adminModal:', adminModal);
    console.log('adminClose:', adminClose);
    console.log('adminFrame:', adminFrame);
    
    if (!adminButton) {
        console.error('❌ Кнопка админ-панели не найдена!');
        return;
    }
    
    if (!adminModal) {
        console.error('❌ Модальное окно админ-панели не найдено!');
        return;
    }
    
    // Открытие админ-панели
    adminButton.addEventListener('click', function(e) {
        console.log('🔧 Клик по кнопке админ-панели!');
        e.preventDefault();
        // Если зажат Ctrl/Cmd - открываем в новой вкладке
        if (e.ctrlKey || e.metaKey) {
            console.log('🔧 Открываем в новой вкладке...');
            window.open('admin-panel-connected.html?t=' + new Date().getTime(), '_blank');
            return;
        }
        
        console.log('🔧 Открываем админ-панель в новой вкладке...');
        // Открываем админ-панель в новой вкладке (решение проблемы с iframe)
        window.open('admin-panel-connected.html?t=' + new Date().getTime(), '_blank');
        console.log('🔧 Админ-панель открыта в новой вкладке!');
        
        // Звуковой эффект
        if (window.playClickSound) {
            playClickSound();
        }
    });
    
    // Закрытие админ-панели
    function closeAdminPanel() {
        adminModal.style.display = 'none';
        adminFrame.src = ''; // Останавливаем загрузку iframe
        document.body.style.overflow = 'auto'; // Восстанавливаем скролл
    }
    
    // Закрытие по крестику
    adminClose.addEventListener('click', closeAdminPanel);
    
    // Закрытие по клику вне модального окна
    adminModal.addEventListener('click', function(e) {
        if (e.target === adminModal) {
            closeAdminPanel();
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && adminModal.style.display === 'block') {
            closeAdminPanel();
        }
    });
    
    // Слушатель сообщений от iframe для правильного закрытия
    window.addEventListener('message', function(event) {
        if (event.data === 'closeAdminPanel') {
            closeAdminPanel();
        }
    });
    
    console.log('✅ Админ-панель инициализирована');
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ =====
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupLoadingScreen();
    setupFormValidation();
    setupFormSubmission();
    setupNewsModal();
    setupCarousel();
    setupScrollAnimations();
    setupSoundEffects();
    // setupTypewriterEffect(); // Отключено - используем новую систему
    setupBackgroundPaths();
    // setupAdminAccess(); // Убираем инициализацию отдельной секции админки
    initAdminPanel(); // Инициализация модального окна админ-панели
    
    // Админ-панель теперь только в навигации
});

// ===== ИНИЦИАЛИЗАЦИЯ ЭЛЕМЕНТОВ =====
function initializeElements() {
    form = document.getElementById('surveyForm');
    submitButton = document.getElementById('submitButton');
    newsModal = document.getElementById('newsModal');
    
    // Проверяем существование элементов перед их использованием
    if (form && submitButton) {
        inputs = form.querySelectorAll('input, select');
    } else {
        console.warn('⚠️ Форма или кнопка не найдены, продолжаем без них');
        inputs = [];
    }
}

// ===== КАРУСЕЛЬ ЗАМЕНЕНА НА КРУГОВУЮ ГАЛЕРЕЮ =====
function setupCarousel() {
    // Карусель больше не используется - теперь круговая галерея
    console.log('✅ Круговая галерея активна');
}

// ===== УПРАВЛЕНИЕ ЭКРАНОМ ЗАГРУЗКИ =====
function setupLoadingScreen() {
    console.log('🔄 Настройка экрана загрузки...');
    
    // Убираем загрузку быстро для отладки
    setTimeout(function() {
        const loadingScreen = document.getElementById('loadingScreen');
        const mainContent = document.getElementById('mainContent');
        
        console.log('📱 LoadingScreen найден:', !!loadingScreen);
        console.log('📱 MainContent найден:', !!mainContent);
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            console.log('✅ Скрыл экран загрузки');
        }
        
        if (mainContent) {
            mainContent.style.opacity = '1';
            mainContent.style.visibility = 'visible';
            console.log('✅ Показал главный контент');
        }
        
        // Анимации теперь контролируются скроллингом - убираем автоактивацию
        setTimeout(() => {
            console.log('🎬 Анимации теперь работают при скролле');
        }, 200);
        
    }, 500); // Быстрая загрузка для отладки
}

// ===== ВАЛИДАЦИЯ ФОРМЫ =====
function setupFormValidation() {
    if (!inputs || inputs.length === 0) {
        console.warn('⚠️ Элементы формы не найдены, пропускаем валидацию');
        return;
    }
    
    // Добавляем обработчики событий для валидации
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateField(this);
            checkFormValidity();
        });

        input.addEventListener('blur', function() {
            validateField(this);
            checkFormValidity();
        });
    });

    // Проверяем валидность формы при загрузке
    checkFormValidity();
}

// ===== ПРОВЕРКА ВАЛИДНОСТИ ВСЕЙ ФОРМЫ =====
function checkFormValidity() {
    if (!inputs || inputs.length === 0 || !submitButton) {
        return;
    }
    
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
        }
        
        if (input.classList.contains('error')) {
            isValid = false;
        }
    });
    
    submitButton.disabled = !isValid;
}

// ===== ВАЛИДАЦИЯ ОТДЕЛЬНОГО ПОЛЯ =====
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.id;
    const errorElement = document.getElementById(fieldName + 'Error');
    let isValid = true;
    let errorMessage = '';

    // Очищаем предыдущие ошибки
    field.classList.remove('error');
    errorElement.textContent = '';

    switch (fieldName) {
        case 'name':
            if (!value) {
                isValid = false;
                errorMessage = CONFIG.TEXTS.ERRORS.REQUIRED;
            } else if (value.length > CONFIG.VALIDATION.NAME_MAX_LENGTH) {
                isValid = false;
                errorMessage = CONFIG.TEXTS.ERRORS.NAME_TOO_LONG;
            }
            break;

        case 'nickname':
            if (!value) {
                isValid = false;
                errorMessage = CONFIG.TEXTS.ERRORS.REQUIRED;
            } else if (value.length > CONFIG.VALIDATION.NICKNAME_MAX_LENGTH) {
                isValid = false;
                errorMessage = CONFIG.TEXTS.ERRORS.NICKNAME_TOO_LONG;
            }
            break;

        case 'age':
            const age = parseInt(value);
            if (!value) {
                isValid = false;
                errorMessage = CONFIG.TEXTS.ERRORS.REQUIRED;
            } else if (age < CONFIG.VALIDATION.AGE_MIN || age > CONFIG.VALIDATION.AGE_MAX) {
                isValid = false;
                errorMessage = CONFIG.TEXTS.ERRORS.AGE_INVALID;
            }
            break;

        case 'telegram':
            if (!value) {
                isValid = false;
                errorMessage = CONFIG.TEXTS.ERRORS.REQUIRED;
            } else if (!CONFIG.VALIDATION.TELEGRAM_PATTERN.test(value)) {
                isValid = false;
                errorMessage = CONFIG.TEXTS.ERRORS.TELEGRAM_INVALID;
            }
            break;

        case 'timezone':
            if (!value) {
                isValid = false;
                errorMessage = CONFIG.TEXTS.ERRORS.REQUIRED;
            }
            break;

        case 'platform':
            if (!value) {
                isValid = false;
                errorMessage = CONFIG.TEXTS.ERRORS.PLATFORM_REQUIRED;
            }
            break;
    }

    if (!isValid) {
        field.classList.add('error');
        errorElement.textContent = errorMessage;
    }

    return isValid;
}

// ===== ОБРАБОТКА ОТПРАВКИ ФОРМЫ =====
function setupFormSubmission() {
    if (!form) {
        console.warn('⚠️ Форма не найдена, пропускаем настройку отправки');
        return;
    }
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Валидируем все поля
        let isFormValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            return;
        }

        // Собираем данные формы
        const formData = collectFormData();
        
        // Отправляем данные
        await submitForm(formData);
    });
}

// ===== СБОР ДАННЫХ ФОРМЫ =====
function collectFormData() {
    return {
        name: document.getElementById('name').value.trim(),
        nickname: document.getElementById('nickname').value.trim(),
        age: document.getElementById('age').value.trim(),
        telegram: document.getElementById('telegram').value.trim(),
        timezone: document.getElementById('timezone').value.trim(),
        platform: document.getElementById('platform').value
    };
}

// ===== ОТПРАВКА ФОРМЫ =====
async function submitForm(formData) {
    try {
        // Формируем сообщение для Telegram
        const message = formatTelegramMessage(formData);
        
        // Отправляем данные в Telegram
        const response = await sendToTelegram(message);

        if (response.ok) {
            handleSuccessfulSubmission();
        } else {
            throw new Error('Ошибка отправки');
        }
    } catch (error) {
        handleSubmissionError(error);
    }
}

// ===== ФОРМАТИРОВАНИЕ СООБЩЕНИЯ ДЛЯ TELEGRAM =====
function formatTelegramMessage(formData) {
    return `🎮 Новая анкета с TravHouse!\n\n` +
           `👤 Имя: ${formData.name}\n` +
           `🎯 Никнейм: ${formData.nickname}\n` +
           `🎂 Возраст: ${formData.age} лет\n` +
           `📱 Telegram: ${formData.telegram}\n` +
           `🌍 Часовой пояс: ${formData.timezone}\n` +
           `💻 Платформа: ${formData.platform}`;
}

// ===== ОТПРАВКА В TELEGRAM =====
async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // Если есть массив chat_ids, отправляем всем
    if (CONFIG.TELEGRAM_CHAT_IDS && Array.isArray(CONFIG.TELEGRAM_CHAT_IDS)) {
        const promises = CONFIG.TELEGRAM_CHAT_IDS.map(chatId => 
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message
                })
            })
        );
        
        // Ждем отправки всем админам
        const responses = await Promise.allSettled(promises);
        
        // Возвращаем успех если хотя бы одна отправка прошла
        return responses.some(response => response.status === 'fulfilled' && response.value.ok)
            ? { ok: true } 
            : { ok: false };
    }
    
    // Fallback для старой конфигурации с одним chat_id
    return await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: CONFIG.TELEGRAM_CHAT_ID || CONFIG.TELEGRAM_CHAT_IDS[0],
            text: message
        })
    });
}

// ===== ОБРАБОТКА УСПЕШНОЙ ОТПРАВКИ =====
function handleSuccessfulSubmission() {
    // Показываем сообщение об успехе
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    
    // Очищаем форму
    resetForm();
    
    // Скрываем сообщение через заданное время
    setTimeout(function() {
        successMessage.style.display = 'none';
    }, CONFIG.SUCCESS_DURATION);
}

// ===== ОБРАБОТКА ОШИБКИ ОТПРАВКИ =====
function handleSubmissionError(error) {
    console.error('Ошибка при отправке анкеты:', error);
    alert(CONFIG.TEXTS.ERROR_MESSAGE);
}

// ===== СБРОС ФОРМЫ =====
function resetForm() {
    form.reset();
    
    // Очищаем все ошибки
    inputs.forEach(input => {
        input.classList.remove('error');
        const errorElement = document.getElementById(input.id + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
        }
    });
    
    // Деактивируем кнопку
    submitButton.disabled = true;
}

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

// Проверка, загружена ли страница
function isPageLoaded() {
    return document.readyState === 'complete';
}

// Добавление класса с анимацией
function addClassWithDelay(element, className, delay = 0) {
    setTimeout(() => {
        element.classList.add(className);
    }, delay);
}

// Удаление класса с анимацией
function removeClassWithDelay(element, className, delay = 0) {
    setTimeout(() => {
        element.classList.remove(className);
    }, delay);
}

// Плавное появление элемента
function fadeIn(element, duration = 1000) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    
    setTimeout(() => {
        element.style.opacity = '1';
    }, 10);
}

// Плавное исчезновение элемента
function fadeOut(element, duration = 1000) {
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, duration);
}

// ===== УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ НОВОСТЕЙ =====
function setupNewsModal() {
    const openNewsButton = document.getElementById('openNewsModal');
    const closeNewsButton = document.getElementById('closeNewsModal');
    
    // Открытие модального окна
    openNewsButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        newsModal.style.display = 'block';
        // Не блокируем скролл страницы для лучшего UX
    });
    
    // Закрытие модального окна
    closeNewsButton.addEventListener('click', function() {
        closeNewsModal();
    });
    
    // Закрытие при клике вне модального окна
    window.addEventListener('click', function(event) {
        if (event.target === newsModal) {
            closeNewsModal();
        }
    });
    
    // Закрытие по ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && newsModal.style.display === 'block') {
            closeNewsModal();
        }
    });
}

// ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА НОВОСТЕЙ =====
function closeNewsModal() {
    newsModal.style.display = 'none';
    // Убираем блокировку скролла
}

// ===== ПРОСТАЯ АНИМАЦИЯ ПРИ СКРОЛЛЕ - РАБОЧАЯ ВЕРСИЯ =====
function setupScrollAnimations() {
    console.log('🎬 Запускаем простую систему анимаций...');
    
    // Добавляем стили анимации прямо в код, чтобы они точно работали
    if (!document.getElementById('scroll-animations-style')) {
        const style = document.createElement('style');
        style.id = 'scroll-animations-style';
        style.textContent = `
            .scroll-animate {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                will-change: transform, opacity;
                position: relative;
                z-index: 10;
            }
            .scroll-animate.animate-visible {
                opacity: 1;
                transform: translateY(0);
            }
            .scroll-animate.slide-left-anim {
                transform: translateX(-40px);
                opacity: 0;
            }
            .scroll-animate.slide-left-anim.animate-visible {
                transform: translateX(0);
                opacity: 1;
            }
            .scroll-animate.slide-right-anim {
                transform: translateX(40px);
                opacity: 0;
            }
            .scroll-animate.slide-right-anim.animate-visible {
                transform: translateX(0);
                opacity: 1;
            }
            .scroll-animate.scale-anim {
                transform: scale(0.9);
                opacity: 0;
            }
            .scroll-animate.scale-anim.animate-visible {
                transform: scale(1);
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
        console.log('✅ Стили анимации добавлены в документ');
    }
    
    // Находим ВСЕ секции и блоки
    const allElements = document.querySelectorAll(`
        section, 
        .builds-section, 
        .features-section, 
        .stats-section, 
        .contact-section, 
        .form-container,
        .welcome-text,
        .description-text,
        .build-card,
        .feature-card,
        .stat-card,
        .main-header,
        .linear-gallery,
        h2,
        .section-title
    `);
    
    console.log('🔍 Найдено элементов для анимации:', allElements.length);
    
    // Добавляем классы анимации ко всем найденным элементам
    const animations = ['', 'slide-left-anim', 'slide-right-anim', 'scale-anim'];
    
    allElements.forEach((element, index) => {
        // Пропускаем уже анимированные элементы
        if (element.classList.contains('scroll-animate')) {
            return;
        }
        
        element.classList.add('scroll-animate');
        if (animations[index % 4]) {
            element.classList.add(animations[index % 4]);
        }
        
        console.log(`➕ Элемент ${index + 1}: ${element.tagName} получил анимацию`);
    });
    
    // Простая функция проверки видимости
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        return (
            rect.top < windowHeight * 0.9 && // Элемент вошел в нижние 90% экрана (раньше срабатывает)
            rect.bottom > 0 // Элемент не вышел за верх экрана
        );
    }
    
    // Функция проверки всех элементов
    function checkAnimations() {
        const scrollAnimateElements = document.querySelectorAll('.scroll-animate');
        
        scrollAnimateElements.forEach((element, index) => {
            const isVisible = isInViewport(element);
            const isAnimated = element.classList.contains('animate-visible');
            
            if (isVisible && !isAnimated) {
                // Мгновенная анимация без задержек
                element.classList.add('animate-visible');
                console.log(`✨ Анимируем: ${element.tagName} (${index + 1})`);
            } else if (!isVisible && isAnimated) {
                // Убираем анимацию когда элемент ушел
                element.classList.remove('animate-visible');
                console.log(`💫 Скрываем: ${element.tagName} (${index + 1})`);
            }
        });
    }
    
    // Обработчик скролла
    let ticking = false;
    function handleScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                checkAnimations();
                ticking = false;
            });
            ticking = true;
        }
    }
    
    // Добавляем обработчик скролла
    window.addEventListener('scroll', handleScroll);
    
    // Быстрая первоначальная проверка
    setTimeout(() => {
        console.log('🚀 Первоначальная проверка...');
        checkAnimations();
    }, 500);
    
    // Дополнительная проверка через 1 секунду
    setTimeout(() => {
        console.log('🔄 Дополнительная проверка...');
        checkAnimations();
    }, 1500);
    
    console.log('✅ Простая система анимаций запущена!');
}

// Удалена старая сложная функция setupObserver - теперь используем простую систему выше

// ===== ЗВУКОВЫЕ ЭФФЕКТЫ =====
function setupSoundEffects() {
    let audioContext = null;
    let userInteracted = false;
    
    // Инициализация аудио после первого пользовательского взаимодействия
    const initAudio = async () => {
        if (!audioContext && !userInteracted) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                await audioContext.resume();
                userInteracted = true;
                console.log('🔊 Аудио контекст для звуковых эффектов инициализирован');
            } catch (error) {
                console.warn('🔇 Не удалось инициализировать аудио для звуковых эффектов:', error.message);
            }
        }
    };
    
    // Создаем звуки с проверкой аудио контекста
    const createClickSound = () => createMinecraftClickSound(audioContext, userInteracted);
    const createHoverSound = () => createMinecraftHoverSound(audioContext, userInteracted);
    
    // Добавляем звуки на клики
    document.addEventListener('click', async (e) => {
        if (!userInteracted) {
            await initAudio();
        }
        
        if (e.target.matches('button, .nav-link, .build-item, .social-link, .carousel-btn, .indicator')) {
            playSound(createClickSound);
        }
    });
    
    // Добавляем звуки на наведение
    const hoverElements = document.querySelectorAll('button, .nav-link, .build-item, .social-link, .carousel-btn');
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', async () => {
            if (!userInteracted) {
                await initAudio();
            }
            playSound(createHoverSound);
        });
    });
}

function createMinecraftClickSound(audioContext, userInteracted) {
    if (!audioContext || !userInteracted) return () => {};
    
    return () => {
        try {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.warn('🔇 Ошибка воспроизведения звука клика:', error.message);
        }
    };
}

function createMinecraftHoverSound(audioContext, userInteracted) {
    if (!audioContext || !userInteracted) return () => {};
    
    return () => {
        try {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(700, audioContext.currentTime + 0.05);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
        } catch (error) {
            console.warn('🔇 Ошибка воспроизведения звука наведения:', error.message);
        }
    };
}

function playSound(soundFunction) {
    try {
        soundFunction();
    } catch (error) {
        // Игнорируем ошибки звука для лучшего UX
    }
}

// ===== ЭКСПОРТ ФУНКЦИЙ ДЛЯ ОТЛАДКИ =====
window.DEBUG = {
    validateField,
    checkFormValidity,
    collectFormData,
    formatTelegramMessage,
    openNewsModal: () => newsModal.style.display = 'block',
    closeNewsModal,
    CONFIG
};

// ===== КРУТЫЕ АНИМАЦИИ И ЭФФЕКТЫ =====

// Создание плавающих частиц
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
    
    setInterval(() => {
        createParticle(particlesContainer);
    }, 4000);
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 6 + 2;
    const startX = Math.random() * window.innerWidth;
    const animationDuration = Math.random() * 8 + 12;
    
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = startX + 'px';
    particle.style.animationDuration = animationDuration + 's';
    particle.style.opacity = Math.random() * 0.6 + 0.2;
    
    container.appendChild(particle);
    
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, animationDuration * 1000);
}

// Добавление эффектов к кнопкам
function addButtonEffects() {
    const buttons = document.querySelectorAll('button, .nav-link, .carousel-btn');
    buttons.forEach(button => {
        button.classList.add('glow-button');
        
        button.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.6)';
            this.style.transform = 'scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
            this.style.transform = '';
        });
    });
}

// Падающие звезды
function createFallingStar() {
    const star = document.createElement('div');
    star.style.cssText = `
        position: fixed;
        width: 2px;
        height: 2px;
        background: #ffffff;
        border-radius: 50%;
        left: ${Math.random() * window.innerWidth}px;
        top: -10px;
        z-index: 1;
        animation: falling 6s linear forwards;
        box-shadow: 0 0 6px #ffffff;
    `;
    
    document.body.appendChild(star);
    
    setTimeout(() => {
        if (star.parentNode) {
            star.parentNode.removeChild(star);
        }
    }, 6000);
}

// След курсора
function createCursorTrail(e) {
    if (Math.random() > 0.3) return; // Только 30% шанс создания следа
    
    const trail = document.createElement('div');
    trail.style.cssText = `
        position: fixed;
        left: ${e.clientX - 2}px;
        top: ${e.clientY - 2}px;
        width: 4px;
        height: 4px;
        background: rgba(0, 255, 255, 0.8);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        animation: trail-fade 0.8s ease-out forwards;
    `;
    
    document.body.appendChild(trail);
    
    setTimeout(() => {
        if (trail.parentNode) {
            trail.parentNode.removeChild(trail);
        }
    }, 800);
}

// Глитч эффект для заголовка
function addRandomGlitch() {
    const title = document.querySelector('.server-title');
    if (!title) return;
    
    setInterval(() => {
        if (Math.random() > 0.8) { // 20% шанс глитча
            title.style.animation = 'glitch-skew 0.3s ease-in-out';
            
            setTimeout(() => {
                title.style.animation = '';
            }, 300);
        }
    }, 5000);
}

// Инициализация всех эффектов
function initializeAdvancedAnimations() {
    console.log('🎨 Инициализация крутых анимаций...');
    
    createParticles();
    addButtonEffects();
    addRandomGlitch();
    
    // Падающие звезды каждые 10 секунд
    setInterval(createFallingStar, 10000);
    createFallingStar();
    
    // След курсора
    document.addEventListener('mousemove', createCursorTrail);
    
    console.log('✨ Анимации активированы!');
}

// CSS для дополнительных анимаций
const enhancedCSS = `
@keyframes trail-fade {
    0% { opacity: 0.8; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.3); }
}

@keyframes falling {
    0% { 
        transform: translateY(-100px) translateX(0px); 
        opacity: 0; 
    }
    10% { 
        opacity: 1; 
    }
    90% { 
        opacity: 1; 
    }
    100% { 
        transform: translateY(100vh) translateX(200px); 
        opacity: 0; 
    }
}

.glow-button {
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.enhanced-hover:hover {
    filter: brightness(1.2) saturate(1.2);
}
`;

// Добавляем стили
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = enhancedCSS;
document.head.appendChild(enhancedStyles);

// ===== ЭФФЕКТ ПЕЧАТАЮЩЕЙСЯ МАШИНКИ =====
function setupTypewriterEffect() {
    const titleElement = document.getElementById('typewriter-title');
    const text = 'TRAVHOUSE';
    let index = 0;
    
    // Создаем звук печатания
    const typeSound = createTypewriterSound();
    
    // Функция печатания по буквам с анимацией
    function typeText() {
        if (index < text.length) {
            // Создаем span для каждой буквы с анимацией
            const letterSpan = document.createElement('span');
            letterSpan.className = 'letter';
            letterSpan.textContent = text[index];
            letterSpan.style.animationDelay = '0s';
            
            titleElement.appendChild(letterSpan);
            
            // Играем звук печатания
            playSound(() => typeSound());
            
            index++;
            
            // Случайная задержка между символами для реалистичности
            const delay = Math.random() * 150 + 120; // От 120 до 270мс
            setTimeout(typeText, delay);
        } else {
            // Когда печатание закончено - финальный звук
            setTimeout(() => {
                playSound(() => createTypewriterDingSound()());
                titleElement.classList.add('typing-complete');
                console.log('✅ Эффект печатающейся машинки завершен');
            }, 300);
        }
    }
    
    // Запускаем печатание через 1 секунду после загрузки контента
    setTimeout(() => {
        console.log('🖨️ Запуск эффекта печатающейся машинки');
        typeText();
    }, 1500);
}

// Звук печатающейся машинки
function createTypewriterSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    return () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Настройки для звука печатания
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(350, audioContext.currentTime + 0.05);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
    };
}

// Звук завершения печати (динь!)
function createTypewriterDingSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    return () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };
}

// ===== АНИМИРОВАННЫЕ ПУТИ НА ФОНЕ =====
function setupBackgroundPaths() {
    const container = document.getElementById('backgroundPaths');
    const pathCount = 6; // Количество путей
    
    console.log('🛤️ Создание анимированных путей...');
    
    for (let i = 0; i < pathCount; i++) {
        createAnimatedPath(container, i);
    }
    
    // Периодически создаем новые пути
    setInterval(() => {
        if (container.children.length < pathCount * 2) {
            createAnimatedPath(container, Math.floor(Math.random() * 3));
        }
    }, 5000);
}

function createAnimatedPath(container, variant = 0) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Размеры контейнера
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.classList.add('animated-path');
    
    // Генерируем случайный путь
    const pathData = generateRandomPath(width, height);
    path.setAttribute('d', pathData);
    
    // Применяем варианты стилей
    const variants = ['', 'variant-2', 'variant-3'];
    path.classList.add('path-line');
    if (variants[variant % 3]) {
        path.classList.add(variants[variant % 3]);
    }
    
    svg.appendChild(path);
    container.appendChild(svg);
    
    // Удаляем путь после завершения анимации
    setTimeout(() => {
        if (svg.parentNode) {
            svg.parentNode.removeChild(svg);
        }
    }, 15000);
}

function generateRandomPath(width, height) {
    // Создаем изогнутый путь через экран
    const startX = Math.random() * width * 0.2; // Начало слева
    const startY = Math.random() * height;
    
    const endX = width - Math.random() * width * 0.2; // Конец справа
    const endY = Math.random() * height;
    
    // Контрольные точки для кривых Безье
    const cp1X = width * 0.25 + Math.random() * width * 0.2;
    const cp1Y = Math.random() * height;
    
    const cp2X = width * 0.55 + Math.random() * width * 0.2;
    const cp2Y = Math.random() * height;
    
    const cp3X = width * 0.75 + Math.random() * width * 0.1;
    const cp3Y = Math.random() * height;
    
    // Создаем плавную кривую через несколько точек
    return `M ${startX} ${startY} 
            C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${width/2} ${height/2 + (Math.random() - 0.5) * height * 0.3}
            S ${cp3X} ${cp3Y}, ${endX} ${endY}`;
}

// Запуск анимаций после полной загрузки
setTimeout(() => {
    initializeAdvancedAnimations();
    
    // Добавляем enhanced-hover класс ко всем интерактивным элементам
    const interactiveElements = document.querySelectorAll('.build-item, .nav-link, button');
    interactiveElements.forEach(el => el.classList.add('enhanced-hover'));
    
}, 2000);

// ===== АДМИН-ПАНЕЛЬ ТЕПЕРЬ ТОЛЬКО В НАВИГАЦИИ =====
// Удалены функции setupAdminAccess, forceSetupAdminButtons, showAdminLogin, 
// checkAdminPassword, closeAdminModal, showAdminInterface, showNotification
// так как админ-панель теперь доступна только через кнопку в верхней навигации