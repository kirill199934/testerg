#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Простой запускальщик бота с обработкой ошибок
"""

import sys
import asyncio
import logging
from telegram_bot import main

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('travhouse_bot.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def run_bot():
    """Запуск бота с обработкой ошибок"""
    try:
        logger.info("🤖 Запуск TravHouse Telegram Bot...")
        main()
    except KeyboardInterrupt:
        logger.info("⏹️ Бот остановлен пользователем")
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}")
        logger.info("🔄 Перезапуск через 5 секунд...")
        import time
        time.sleep(5)
        run_bot()  # Перезапуск при ошибке

if __name__ == "__main__":
    run_bot()