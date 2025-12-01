// ===== УЛУЧШЕННАЯ ПЕЧАТАЮЩАЯ МАШИНКА С ОШИБКАМИ =====

class EnhancedTypewriter {
    constructor(element, options = {}) {
        this.element = element;
        this.finalText = 'TRAVHOUSE';
        this.currentText = '';
        this.currentIndex = 0;
        
        // Настройки
        this.options = {
            typeSpeed: 150,
            errorSpeed: 80,
            deleteSpeed: 60,
            pauseTime: 800,
            errorChance: 0.3,
            ...options
        };
        
        // Карта "ошибок" - что печатается вместо правильной буквы
        this.errorMap = {
            'T': ['Y', 'R', 'F', 'G'],
            'R': ['E', 'T', 'F', 'D'],
            'A': ['S', 'Q', 'W', 'Z'],
            'V': ['C', 'F', 'G', 'B'],
            'H': ['G', 'J', 'N', 'Y'],
            'O': ['I', 'P', 'L', '0'],
            'U': ['Y', 'I', 'O', '8'],
            'S': ['A', 'D', 'W', 'Z'],
            'E': ['R', 'W', 'D', '3']
        };
        
        this.isTyping = false;
        this.cursor = true;
        this.userInteracted = false;
        this.audioContext = null;
        this.audioInitialized = false;
        this.startCursor();
    }
    
    // Начинаем анимацию курсора
    startCursor() {
        setInterval(() => {
            this.cursor = !this.cursor;
            this.updateDisplay();
        }, 500);
    }
    
    // Обновляем отображение
    updateDisplay() {
        const cursorChar = this.cursor ? '|' : ' ';
        this.element.innerHTML = `
            <span class="typewriter-text" style="
                color: var(--accent-color);
                font-family: 'Orbitron', monospace;
                font-weight: 700;
                font-size: inherit;
                text-shadow: 
                    0 0 10px var(--accent-color),
                    0 0 20px var(--accent-color),
                    0 0 30px var(--accent-color);
                letter-spacing: 4px;
            ">${this.currentText}</span><span class="typewriter-cursor" style="
                color: var(--accent-color);
                animation: cursorBlink 1s infinite;
                font-weight: bold;
            ">${cursorChar}</span>
        `;
    }
    
    // Основной метод печатания
    async startTyping() {
        if (this.isTyping) {
            console.log('⚠️ Печатание уже идет, пропускаем...');
            return;
        }
        this.isTyping = true;
        
        console.log('🖨️ Запуск улучшенной печатающей машинки...');
        console.log('📝 Финальный текст:', this.finalText);
        
        for (let i = 0; i < this.finalText.length; i++) {
            const targetChar = this.finalText[i];
            
            // Решаем, делать ли ошибку
            const shouldMakeError = Math.random() < this.options.errorChance && this.errorMap[targetChar];
            
            if (shouldMakeError) {
                await this.typeWithError(targetChar, i);
            } else {
                await this.typeCorrectChar(targetChar, i);
            }
        }
        
        // Финальная пауза
        await this.pause(this.options.pauseTime);
        
        // Добавляем финальные эффекты
        this.addFinalEffects();
        
        this.isTyping = false;
        console.log('✅ Печатание завершено');
    }
    
    // Печатаем правильную букву
    async typeCorrectChar(char, index) {
        await this.pause(this.options.typeSpeed);
        this.currentText += char;
        this.updateDisplay();
        this.playTypeSound();
    }
    
    // Печатаем с ошибкой и исправлением
    async typeWithError(correctChar, index) {
        const wrongChars = this.errorMap[correctChar];
        const wrongChar = wrongChars[Math.floor(Math.random() * wrongChars.length)];
        
        // Печатаем неправильную букву
        await this.pause(this.options.typeSpeed);
        this.currentText += wrongChar;
        this.updateDisplay();
        this.playErrorSound();
        
        // Пауза осознания ошибки
        await this.pause(this.options.pauseTime * 0.6);
        
        // Удаляем неправильную букву
        await this.pause(this.options.deleteSpeed);
        this.currentText = this.currentText.slice(0, -1);
        this.updateDisplay();
        this.playDeleteSound();
        
        // Небольшая пауза перед правильной буквой
        await this.pause(this.options.errorSpeed);
        
        // Печатаем правильную букву
        this.currentText += correctChar;
        this.updateDisplay();
        this.playTypeSound();
        
        // Пауза после исправления
        await this.pause(this.options.typeSpeed * 0.5);
    }
    
    // Пауза
    pause(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Звуки
    playTypeSound() {
        this.createSound(400, 0.05, 'triangle');
    }
    
    playErrorSound() {
        this.createSound(200, 0.08, 'sawtooth');
    }
    
    playDeleteSound() {
        this.createSound(300, 0.04, 'square');
    }
    
    createSound(frequency, duration, waveType = 'sine') {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        
        // Проверяем, был ли пользователь взаимодействие
        if (!this.userInteracted) {
            // Ждем первого пользовательского взаимодействия
            this.initAudioOnUserGesture();
            return;
        }
        
        try {
            // Используем существующий контекст или создаем новый
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Возобновляем контекст если он приостановлен
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = waveType;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('🔇 Ошибка воспроизведения звука:', error.message);
        }
    }
    
    // Инициализация аудио после первого пользовательского жеста
    initAudioOnUserGesture() {
        if (this.audioInitialized) return;
        
        const initAudio = async () => {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                await this.audioContext.resume();
                this.userInteracted = true;
                this.audioInitialized = true;
                console.log('🔊 Аудио контекст инициализирован после пользовательского жеста');
                
                // Удаляем слушатели после инициализации
                document.removeEventListener('click', initAudio);
                document.removeEventListener('keydown', initAudio);
                document.removeEventListener('touchstart', initAudio);
            } catch (error) {
                console.warn('🔇 Не удалось инициализировать аудио:', error.message);
            }
        };
        
        // Добавляем слушатели для различных пользовательских жестов
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('keydown', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });
        
        console.log('🎵 Ждем пользовательского взаимодействия для инициализации аудио...');
    }
    
    // Финальные эффекты
    addFinalEffects() {
        this.element.style.animation = 'finalGlow 2s ease-in-out';
        
        // Добавляем дополнительное свечение
        setTimeout(() => {
            this.element.style.filter = 'drop-shadow(0 0 20px var(--accent-color))';
        }, 500);
        
        // Убираем эффекты через время
        setTimeout(() => {
            this.element.style.animation = '';
            this.element.style.filter = '';
        }, 3000);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
function initEnhancedTypewriter() {
    console.log('🔍 Ищем элемент для печатающей машинки...');
    
    const titleElement = document.getElementById('typewriter-title');
    if (titleElement) {
        console.log('✅ Элемент найден:', titleElement);
        
        // Очищаем элемент
        titleElement.innerHTML = '';
        
        // Создаем экземпляр печатающей машинки
        const typewriter = new EnhancedTypewriter(titleElement, {
            typeSpeed: 120,
            errorSpeed: 80,
            deleteSpeed: 50,
            pauseTime: 600,
            errorChance: 0.4 // 40% вероятность ошибки
        });
        
        // Запускаем через 2 секунды после загрузки
        setTimeout(() => {
            console.log('🚀 Запуск анимации печатания...');
            typewriter.startTyping();
        }, 2000);
        
        console.log('🖨️ Улучшенная печатающая машинка инициализирована');
    } else {
        console.error('❌ Элемент #typewriter-title не найден!');
        
        // Попробуем найти другие возможные элементы
        const serverTitle = document.querySelector('.server-title');
        if (serverTitle) {
            console.log('🔄 Найден .server-title, используем его');
            serverTitle.id = 'typewriter-title';
            initEnhancedTypewriter(); // Рекурсивный вызов
        }
    }
}

// ===== CSS АНИМАЦИИ =====
function addTypewriterStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes cursorBlink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        
        @keyframes finalGlow {
            0% { 
                transform: scale(1);
                filter: brightness(1);
            }
            50% { 
                transform: scale(1.05);
                filter: brightness(1.3) saturate(1.2);
            }
            100% { 
                transform: scale(1);
                filter: brightness(1);
            }
        }
        
        .typewriter-text {
            display: inline-block;
            position: relative;
        }
        
        .typewriter-cursor {
            display: inline-block;
            font-weight: bold;
            margin-left: 2px;
        }
        
        /* Эффект при печатании */
        .typewriter-text::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--accent-color);
            transform: scaleX(0);
            animation: typeUnderline 0.3s ease forwards;
        }
        
        @keyframes typeUnderline {
            to { transform: scaleX(1); }
        }
    `;
    document.head.appendChild(style);
}

// Экспорт для глобального использования
window.EnhancedTypewriter = EnhancedTypewriter;
window.initEnhancedTypewriter = initEnhancedTypewriter;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, инициализируем печатающую машинку...');
    addTypewriterStyles();
    
    // Пробуем инициализировать сразу
    setTimeout(() => {
        initEnhancedTypewriter();
    }, 500);
    
    // И еще раз через большую задержку на случай если элемент создается динамически
    setTimeout(() => {
        if (!document.querySelector('#typewriter-title .typewriter-text')) {
            console.log('🔄 Повторная попытка инициализации...');
            initEnhancedTypewriter();
        }
    }, 3000);
});

console.log('🖨️ Улучшенная система печатающей машинки загружена!');