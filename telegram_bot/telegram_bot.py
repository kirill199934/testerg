#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TravHouse Minecraft Server Telegram Bot
Полноценный бот с командами, inline кнопками и админскими функциями
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List

from telegram import (
    Update, InlineKeyboardButton, InlineKeyboardMarkup, 
    BotCommand, ReplyKeyboardMarkup, KeyboardButton
)
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler, 
    MessageHandler, filters, ContextTypes
)

# Импорт RCON интеграции
try:
    from minecraft_rcon import get_server_online, get_full_server_stats, send_bot_message
    RCON_AVAILABLE = True
except ImportError:
    print("⚠️ RCON модуль не найден. Используются тестовые данные.")
    RCON_AVAILABLE = False

# ===== КОНФИГУРАЦИЯ =====
BOT_TOKEN = "8341142360:AAFm7SN7n3ZIjxZpyouCk-ksL1Bv6vDM9tY"
ADMIN_IDS = [7740147216]  # Добавьте ID всех админов

# Резервные данные сервера
def get_fallback_stats():
    """Резервные данные когда RCON недоступен"""
    return {
        "online": 5,
        "max_players": 20,
        "players": ["Steve", "Alex", "Notch", "Herobrine", "CreeperKing"],
        "status": "online",
        "tps": "19.8",
        "uptime": "7 дней 12 часов",
        "version": "1.20.1",
        "world_size": "2.1 GB",
        "last_update": datetime.now().strftime('%d.%m.%Y %H:%M')
    }

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ===== ДАННЫЕ =====
# Статистика сервера (в реальности получайте из API сервера)
server_stats = {
    "online": 12,
    "max_players": 50,
    "version": "Bedrock(1.21.90-1.21.124) JAVA(1.21.9)",
    "uptime": "5 дней 12 часов",
    "world_size": "2.1 GB"
}

# Правила сервера
server_rules = [
    "🤝 Уважайте других игроков",
    "🏗️ Не ломайте чужие постройки", 
    "⚡ Не используйте читы и модификации",
    "💬 Общайтесь вежливо в чате",
    "🆘 Помогайте новичкам",
    "🎯 Не спамьте и не флудьте",
    "🎮 Получайте удовольствие от игры!"
]

# База данных анкет (в реальности используйте БД)
applications_db = {}

# ===== ОСНОВНЫЕ КОМАНДЫ =====

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start - приветствие и главное меню"""
    user = update.effective_user
    
    welcome_text = f"""
🎮 **Добро пожаловать в TravHouse!**

Привет, {user.first_name}! 👋

Это официальный бот Minecraft сервера **TravHouse**. 
Здесь ты можешь:

📊 Узнать статистику сервера
👥 Посмотреть онлайн игроков  
📋 Прочитать правила
🌍 Получить IP сервера
📝 Подать заявку на вступление

Выберите действие в меню ниже! ⬇️
    """
    
    keyboard = [
        [
            InlineKeyboardButton("📊 Статистика", callback_data="stats"),
            InlineKeyboardButton("📋 Правила", callback_data="rules")
        ],
        [
            InlineKeyboardButton("📝 Подать заявку", url="https://travhouse.ru"),
            InlineKeyboardButton("📰 Новости", callback_data="news")
        ],
        [
            InlineKeyboardButton("ℹ️ Помощь", callback_data="help"),
            InlineKeyboardButton("⚙️ Настройки", callback_data="settings")
        ]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        await update.message.reply_text(
            welcome_text, 
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )
    elif update.callback_query:
        await update.callback_query.edit_message_text(
            welcome_text, 
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )

async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /stats - статистика сервера"""
    
    # Получаем реальные данные с сервера
    if RCON_AVAILABLE:
        try:
            server_data = await get_full_server_stats()
        except Exception as e:
            logger.error(f"Ошибка получения данных RCON: {e}")
            server_data = get_fallback_stats()
    else:
        server_data = get_fallback_stats()
    
    # Определяем статус сервера
    status_emoji = "✅ Онлайн" if server_data['status'] == 'online' else "❌ Офлайн"
    performance = "Отличная" if float(server_data['tps']) >= 19.0 else "Средняя" if float(server_data['tps']) >= 15.0 else "Низкая"
    
    stats_text = f"""
📊 **Статистика сервера TravHouse**

👥 **Игроки:** {server_data['online']}/{server_data['max_players']}
📦 **Версия:** {server_data['version']}
⏰ **Время работы:** {server_data['uptime']}
💾 **Размер мира:** {server_data['world_size']}
⚡ **TPS:** {server_data['tps']}/20.0
🔄 **Последнее обновление:** {server_data['last_update']}

🎮 **Статус:** {status_emoji}
⚡ **Производительность:** {performance}
🌍 **Регион:** Европа
    """
    
    keyboard = [
        [
            InlineKeyboardButton("🔄 Обновить", callback_data="stats"),
            InlineKeyboardButton("👥 Кто онлайн", callback_data="show_players")
        ],
        [InlineKeyboardButton("⬅️ Главное меню", callback_data="main_menu")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        await update.message.reply_text(stats_text, reply_markup=reply_markup, parse_mode='Markdown')
    else:
        await update.callback_query.edit_message_text(stats_text, reply_markup=reply_markup, parse_mode='Markdown')

async def show_players_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать игроков онлайн"""
    
    # Получаем данные об игроках
    if RCON_AVAILABLE:
        try:
            server_data = await get_server_online()
        except Exception as e:
            logger.error(f"Ошибка получения списка игроков: {e}")
            server_data = get_fallback_stats()
    else:
        server_data = get_fallback_stats()
    
    if server_data['online'] == 0:
        players_text = """👥 **Игроки онлайн**
        
😴 **Никого нет онлайн**

Сервер пустой, самое время зайти первым!
🎮 IP для подключения: `travhouse.ru`"""
    else:
        player_list = "\n".join([f"• {player}" for player in server_data['players']])
        players_text = f"""👥 **Игроки онлайн ({server_data['online']}/{server_data['max_players']})**

{player_list}

🔄 Обновлено: {server_data.get('last_update', datetime.now().strftime('%H:%M'))}"""
    
    keyboard = [
        [
            InlineKeyboardButton("🔄 Обновить", callback_data="show_players"),
            InlineKeyboardButton("📊 Статистика", callback_data="stats")
        ],
        [InlineKeyboardButton("⬅️ Главное меню", callback_data="main_menu")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        await update.message.reply_text(players_text, reply_markup=reply_markup, parse_mode='Markdown')
    elif update.callback_query:
        await update.callback_query.edit_message_text(players_text, reply_markup=reply_markup, parse_mode='Markdown')

async def players_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /players - список игроков онлайн"""
    # В реальности получайте из API сервера
    online_players = [
        "Steve_Builder", "Alex_Miner", "Herobrine_Hunter", "Creeper_King",
        "Diamond_Digger", "Redstone_Engineer", "Craft_Master", "Block_Breaker",
        "Pixel_Warrior", "Cube_Creator", "Grass_Walker", "Stone_Collector"
    ]
    
    players_text = f"""
👥 **Игроки онлайн ({len(online_players)}/{server_stats['max_players']})**

"""
    
    for i, player in enumerate(online_players, 1):
        players_text += f"{i}. 🎮 {player}\n"
    
    if not online_players:
        players_text += "😴 Сейчас никого нет онлайн"
    
    keyboard = [
        [
            InlineKeyboardButton("🔄 Обновить", callback_data="players"),
            InlineKeyboardButton("📊 Статистика", callback_data="stats")
        ],
        [InlineKeyboardButton("⬅️ Главное меню", callback_data="main_menu")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        await update.message.reply_text(players_text, reply_markup=reply_markup, parse_mode='Markdown')
    else:
        await update.callback_query.edit_message_text(players_text, reply_markup=reply_markup, parse_mode='Markdown')

async def rules_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /rules - правила сервера"""
    rules_text = "📋 **Правила сервера TravHouse**\n\n"
    
    for i, rule in enumerate(server_rules, 1):
        rules_text += f"{i}. {rule}\n"
    
    rules_text += "\n❗ **Нарушение правил ведет к бану!**"
    
    keyboard = [
        [
            InlineKeyboardButton("📝 Подать заявку", url="https://travhouse.ru"),
            InlineKeyboardButton("👥 Игроки", callback_data="players")
        ],
        [InlineKeyboardButton("⬅️ Главное меню", callback_data="main_menu")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        await update.message.reply_text(rules_text, reply_markup=reply_markup, parse_mode='Markdown')
    else:
        await update.callback_query.edit_message_text(rules_text, reply_markup=reply_markup, parse_mode='Markdown')

async def server_ip_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """IP адрес сервера"""
    ip_text = f"""
🌍 **Подключение к серверу TravHouse**

**Bedrock Edition:**
📱 IP: `bedrock.travhouse.ru`
🔢 Порт: `19132`

**Java Edition:**  
💻 IP: `java.travhouse.ru`
🔢 Порт: `25565`

📋 **Инструкция:**
1. Откройте Minecraft
2. Добавьте сервер
3. Введите IP и порт
4. Наслаждайтесь игрой!

⚠️ **Важно:** Для входа нужно пройти whitelist!
    """
    
    keyboard = [
        [
            InlineKeyboardButton("📝 Подать заявку", url="https://travhouse.ru"),
            InlineKeyboardButton("📋 Правила", callback_data="rules")
        ],
        [InlineKeyboardButton("⬅️ Главное меню", callback_data="main_menu")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        await update.message.reply_text(ip_text, reply_markup=reply_markup, parse_mode='Markdown')
    else:
        await update.callback_query.edit_message_text(ip_text, reply_markup=reply_markup, parse_mode='Markdown')

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /help - помощь"""
    help_text = """
ℹ️ **Помощь по боту TravHouse**

**Основные команды:**
/start - Главное меню
/stats - Статистика сервера  
/players - Игроки онлайн
/rules - Правила сервера
/ip - IP для подключения
/help - Эта справка

**Для админов:**
/admin - Админ панель
/applications - Заявки игроков
/broadcast - Рассылка всем

**Полезные ссылки:**
🌐 Сайт: travhouse.ru
💬 Чат: @travhouse_chat
📰 Новости: @travhouse_news

❓ **Нужна помощь?** Обратитесь к админам!
    """
    
    keyboard = [
        [
            InlineKeyboardButton("📊 Статистика", callback_data="stats"),
            InlineKeyboardButton("👥 Игроки", callback_data="players")
        ],
        [InlineKeyboardButton("⬅️ Главное меню", callback_data="main_menu")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        await update.message.reply_text(help_text, reply_markup=reply_markup, parse_mode='Markdown')
    else:
        await update.callback_query.edit_message_text(help_text, reply_markup=reply_markup, parse_mode='Markdown')

# ===== АДМИНСКИЕ КОМАНДЫ =====

async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Админ панель"""
    user_id = update.effective_user.id
    
    if user_id not in ADMIN_IDS:
        await update.message.reply_text("❌ У вас нет прав администратора!")
        return
    
    admin_text = """
⚙️ **Админ панель TravHouse**

Добро пожаловать в панель управления!
    """
    
    keyboard = [
        [
            InlineKeyboardButton("📝 Заявки игроков", callback_data="admin_applications"),
            InlineKeyboardButton("📊 Статистика бота", callback_data="admin_stats")
        ],
        [
            InlineKeyboardButton("📢 Рассылка", callback_data="admin_broadcast"),
            InlineKeyboardButton("👥 Управление игроками", callback_data="admin_players")
        ],
        [
            InlineKeyboardButton("⚙️ Настройки", callback_data="admin_settings"),
            InlineKeyboardButton("📋 Логи", callback_data="admin_logs")
        ],
        [InlineKeyboardButton("⬅️ Главное меню", callback_data="main_menu")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(admin_text, reply_markup=reply_markup, parse_mode='Markdown')

# ===== ОБРАБОТЧИКИ CALLBACK =====

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик всех inline кнопок"""
    query = update.callback_query
    await query.answer()
    
    data = query.data
    
    # Основные команды
    if data == "main_menu":
        await start_command(update, context)
    elif data == "stats":
        await stats_command(update, context)
    elif data == "show_players":
        await show_players_command(update, context)
    elif data == "rules":
        await rules_command(update, context)
    elif data == "help":
        await help_command(update, context)
    elif data == "news":
        await news_handler(update, context)
    elif data == "settings":
        await settings_handler(update, context)
    
    # Админские команды
    elif data.startswith("admin_"):
        await admin_handler(update, context, data)

async def news_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Новости сервера"""
    news_text = """
📰 **Новости TravHouse**

🎉 **01.12.2025 - Открытие сервера!**
Добро пожаловать на наш новый сервер!

⚡ **30.11.2025 - Обновление v1.21**  
Обновили до последней версии!

🏗️ **29.11.2025 - Новые постройки**
Игроки создали крутые постройки!

📅 **Планы на будущее:**
• Новые регионы для строительства
• Еженедельные ивенты
• Система рангов
    """
    
    keyboard = [
        [
            InlineKeyboardButton("🌐 Сайт", url="https://travhouse.ru"),
            InlineKeyboardButton("📢 Канал новостей", url="https://t.me/travhouse_news")
        ],
        [InlineKeyboardButton("⬅️ Главное меню", callback_data="main_menu")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.callback_query.edit_message_text(news_text, reply_markup=reply_markup, parse_mode='Markdown')

async def settings_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Настройки пользователя"""
    settings_text = """
⚙️ **Настройки**

📱 **Уведомления:**
✅ Новости сервера
✅ Статус заявки
❌ Ивенты и акции

🌍 **Язык:** Русский
⏰ **Часовой пояс:** MSK (UTC+3)
    """
    
    keyboard = [
        [
            InlineKeyboardButton("🔔 Настроить уведомления", callback_data="notifications"),
            InlineKeyboardButton("🌍 Сменить язык", callback_data="language")
        ],
        [InlineKeyboardButton("⬅️ Главное меню", callback_data="main_menu")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.callback_query.edit_message_text(settings_text, reply_markup=reply_markup, parse_mode='Markdown')

async def admin_handler(update: Update, context: ContextTypes.DEFAULT_TYPE, data: str):
    """Обработчик админских функций"""
    user_id = update.effective_user.id
    
    if user_id not in ADMIN_IDS:
        await update.callback_query.edit_message_text("❌ Нет доступа!")
        return
    
    if data == "admin_applications":
        # Показать заявки
        apps_text = "📝 **Заявки игроков (последние 5)**\n\n"
        apps_text += "🟡 Ожидают: 3\n✅ Одобрены: 12\n❌ Отклонены: 2"
        
        keyboard = [
            [InlineKeyboardButton("📋 Все заявки", callback_data="all_apps")],
            [InlineKeyboardButton("⬅️ Админ панель", callback_data="admin_menu")]
        ]
        
    elif data == "admin_broadcast":
        apps_text = "📢 **Рассылка сообщений**\n\nОтправьте сообщение для рассылки всем пользователям бота."
        keyboard = [[InlineKeyboardButton("⬅️ Админ панель", callback_data="admin_menu")]]
    
    else:
        apps_text = "🚧 Раздел в разработке..."
        keyboard = [[InlineKeyboardButton("⬅️ Админ панель", callback_data="admin_menu")]]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.callback_query.edit_message_text(apps_text, reply_markup=reply_markup, parse_mode='Markdown')

# ===== ОБРАБОТКА ЗАЯВОК ИЗ САЙТА =====

async def handle_application(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка новых заявок с сайта"""
    message = update.message.text
    
    if "🎮 Новая анкета с TravHouse!" in message:
        # Парсим данные из сообщения
        lines = message.split('\n')
        app_data = {}
        
        for line in lines:
            if 'Имя:' in line:
                app_data['name'] = line.split('Имя: ')[1]
            elif 'Никнейм:' in line:
                app_data['nickname'] = line.split('Никнейм: ')[1]
            elif 'Возраст:' in line:
                app_data['age'] = line.split('Возраст: ')[1]
            elif 'Telegram:' in line:
                app_data['telegram'] = line.split('Telegram: ')[1]
        
        # Создаем админские кнопки
        keyboard = [
            [
                InlineKeyboardButton("✅ Одобрить", callback_data=f"approve_{update.message.message_id}"),
                InlineKeyboardButton("❌ Отклонить", callback_data=f"reject_{update.message.message_id}")
            ],
            [
                InlineKeyboardButton("📝 Запросить доп. инфо", callback_data=f"request_info_{update.message.message_id}"),
                InlineKeyboardButton("👤 Профиль", callback_data=f"profile_{update.message.message_id}")
            ]
        ]
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        # Отправляем всем админам
        for admin_id in ADMIN_IDS:
            try:
                enhanced_message = message + f"\n\n⏰ Подана: {datetime.now().strftime('%d.%m.%Y %H:%M')}"
                await context.bot.send_message(
                    chat_id=admin_id,
                    text=enhanced_message,
                    reply_markup=reply_markup
                )
            except Exception as e:
                logger.error(f"Не удалось отправить админу {admin_id}: {e}")

# ===== ГЛАВНАЯ ФУНКЦИЯ =====

def main():
    """Запуск бота"""
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Команды
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("stats", stats_command))
    application.add_handler(CommandHandler("players", players_command))
    application.add_handler(CommandHandler("rules", rules_command))
    application.add_handler(CommandHandler("ip", server_ip_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("admin", admin_command))
    
    # Обработчики
    application.add_handler(CallbackQueryHandler(button_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_application))
    
    # Запуск
    print("🤖 TravHouse бот запущен!")
    application.run_polling()

if __name__ == "__main__":
    main()