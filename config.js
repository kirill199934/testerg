// ⚠️ НАСТРОЙКИ ПРОЕКТА
// Замените эти значения на ваши реальные данные

// Настройки Telegram бота
const CONFIG = {
    // Telegram Bot API
    TELEGRAM_BOT_TOKEN: '8341142360:AAFm7SN7n3ZIjxZpyouCk-ksL1Bv6vDM9tY',
    TELEGRAM_CHAT_IDS: ['7740147216', '7953791284'], // Замените ВТОРОЙ_ADMIN_CHAT_ID на реальный ID
    
    // Тайминги анимаций (в миллисекундах)
    LOADING_DURATION: 3000,     // Длительность экрана загрузки
    CURTAIN_DURATION: 1000,     // Длительность анимации штор
    SUCCESS_DURATION: 3000,     // Длительность показа сообщения об успехе
    
    // Настройки валидации
    VALIDATION: {
        NAME_MAX_LENGTH: 50,
        NICKNAME_MAX_LENGTH: 30,
        AGE_MIN: 10,
        AGE_MAX: 18,
        TELEGRAM_PATTERN: /^@[a-zA-Z0-9_]{5,32}$/
    },
    
    // Тексты для настройки (можно легко изменить)
    TEXTS: {
        LOADING: 'Loading...',
        SUCCESS_MESSAGE: 'Анкета отправлена!',
        ERROR_MESSAGE: 'Произошла ошибка при отправке анкеты. Попробуйте позже.',
        
        // Сообщения об ошибках валидации
        ERRORS: {
            REQUIRED: 'Поле обязательно для заполнения',
            NAME_TOO_LONG: 'Максимум 50 символов',
            NICKNAME_TOO_LONG: 'Максимум 30 символов',
            AGE_INVALID: 'Возраст должен быть от 10 до 18 лет',
            TELEGRAM_INVALID: 'Формат: @username (5-32 символа)',
            PLATFORM_REQUIRED: 'Выберите платформу'
        }
    }
};

// Экспорт конфигурации для использования в других скриптах
window.CONFIG = CONFIG;