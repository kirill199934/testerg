#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Веб-панель управления TravHouse Bot
Простой интерфейс для админов
"""

from flask import Flask, render_template_string, request, redirect, session, jsonify
import json
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = "travhouse_secret_key_change_me"

# HTML шаблоны
LOGIN_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>TravHouse Bot Admin</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #2a2a40, #4a4a60); margin: 0; padding: 50px; color: white; }
        .container { max-width: 400px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px); }
        h1 { text-align: center; color: #00ffff; text-shadow: 0 0 20px rgba(0,255,255,0.5); }
        input { width: 100%; padding: 15px; margin: 10px 0; border: none; border-radius: 8px; background: rgba(255,255,255,0.2); color: white; font-size: 16px; }
        input::placeholder { color: rgba(255,255,255,0.7); }
        button { width: 100%; padding: 15px; background: linear-gradient(45deg, #00ffff, #0080ff); border: none; border-radius: 8px; color: white; font-size: 16px; cursor: pointer; font-weight: bold; }
        button:hover { background: linear-gradient(45deg, #0080ff, #00ffff); transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 TravHouse Bot</h1>
        <h2 style="text-align: center; margin-bottom: 30px;">Админ панель</h2>
        
        {% if error %}
        <div style="color: #ff6b6b; text-align: center; margin-bottom: 20px;">{{ error }}</div>
        {% endif %}
        
        <form method="POST">
            <input type="text" name="username" placeholder="Логин" required>
            <input type="password" name="password" placeholder="Пароль" required>
            <button type="submit">Войти</button>
        </form>
    </div>
</body>
</html>
"""

DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>TravHouse Bot Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #2a2a40, #4a4a60); margin: 0; padding: 0; color: white; }
        .header { background: rgba(0,0,0,0.3); padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .container { padding: 20px; max-width: 1200px; margin: 0 auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; text-align: center; backdrop-filter: blur(10px); }
        .stat-number { font-size: 2rem; color: #00ffff; font-weight: bold; text-shadow: 0 0 10px rgba(0,255,255,0.5); }
        .applications { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 20px; backdrop-filter: blur(10px); }
        .app-item { background: rgba(255,255,255,0.1); margin: 10px 0; padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
        .btn { padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; text-decoration: none; display: inline-block; }
        .btn-success { background: #4CAF50; color: white; }
        .btn-danger { background: #f44336; color: white; }
        .btn-info { background: #2196F3; color: white; }
        .logout { color: #ff6b6b; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 TravHouse Bot Dashboard</h1>
        <a href="/logout" class="logout">Выйти</a>
    </div>
    
    <div class="container">
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">{{ stats.total_users }}</div>
                <div>Всего пользователей</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{{ stats.total_applications }}</div>
                <div>Подано заявок</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{{ stats.pending_applications }}</div>
                <div>Ожидают проверки</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{{ stats.approved_applications }}</div>
                <div>Одобрено</div>
            </div>
        </div>
        
        <div class="applications">
            <h2>📝 Последние заявки</h2>
            {% for app in applications %}
            <div class="app-item">
                <div>
                    <strong>{{ app.name }}</strong> ({{ app.nickname }})<br>
                    <small>{{ app.age }} лет, {{ app.telegram }}</small>
                </div>
                <div>
                    {% if app.status == 'pending' %}
                    <a href="/approve/{{ app.id }}" class="btn btn-success">✅ Одобрить</a>
                    <a href="/reject/{{ app.id }}" class="btn btn-danger">❌ Отклонить</a>
                    {% else %}
                    <span class="btn btn-info">{{ app.status }}</span>
                    {% endif %}
                </div>
            </div>
            {% endfor %}
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
            <a href="/broadcast" class="btn btn-info">📢 Отправить рассылку</a>
            <a href="/settings" class="btn btn-info">⚙️ Настройки</a>
            <a href="/logs" class="btn btn-info">📋 Логи</a>
        </div>
    </div>
</body>
</html>
"""

# Конфигурация
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "travhouse2025"  # Смените пароль!

# Инициализация БД
def init_db():
    conn = sqlite3.connect('bot_data.db')
    cursor = conn.cursor()
    
    # Таблица пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            telegram_id INTEGER UNIQUE,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица заявок
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY,
            name TEXT,
            nickname TEXT,
            age INTEGER,
            telegram TEXT,
            timezone TEXT,
            platform TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_by INTEGER
        )
    ''')
    
    conn.commit()
    conn.close()

# Получение статистики
def get_stats():
    conn = sqlite3.connect('bot_data.db')
    cursor = conn.cursor()
    
    # Общее количество пользователей
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]
    
    # Общее количество заявок
    cursor.execute("SELECT COUNT(*) FROM applications")
    total_applications = cursor.fetchone()[0]
    
    # Ожидающие заявки
    cursor.execute("SELECT COUNT(*) FROM applications WHERE status = 'pending'")
    pending_applications = cursor.fetchone()[0]
    
    # Одобренные заявки
    cursor.execute("SELECT COUNT(*) FROM applications WHERE status = 'approved'")
    approved_applications = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        'total_users': total_users,
        'total_applications': total_applications,
        'pending_applications': pending_applications,
        'approved_applications': approved_applications
    }

# Получение заявок
def get_applications(limit=10):
    conn = sqlite3.connect('bot_data.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, name, nickname, age, telegram, timezone, platform, status, created_at 
        FROM applications 
        ORDER BY created_at DESC 
        LIMIT ?
    """, (limit,))
    
    applications = []
    for row in cursor.fetchall():
        applications.append({
            'id': row[0],
            'name': row[1],
            'nickname': row[2],
            'age': row[3],
            'telegram': row[4],
            'timezone': row[5],
            'platform': row[6],
            'status': row[7],
            'created_at': row[8]
        })
    
    conn.close()
    return applications

# Маршруты
@app.route('/')
def index():
    if 'logged_in' not in session:
        return redirect('/login')
    
    stats = get_stats()
    applications = get_applications()
    
    return render_template_string(DASHBOARD_TEMPLATE, stats=stats, applications=applications)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['logged_in'] = True
            return redirect('/')
        else:
            return render_template_string(LOGIN_TEMPLATE, error="Неверный логин или пароль")
    
    return render_template_string(LOGIN_TEMPLATE)

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

@app.route('/approve/<int:app_id>')
def approve_application(app_id):
    if 'logged_in' not in session:
        return redirect('/login')
    
    conn = sqlite3.connect('bot_data.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE applications SET status = 'approved' WHERE id = ?", (app_id,))
    conn.commit()
    conn.close()
    
    return redirect('/')

@app.route('/reject/<int:app_id>')
def reject_application(app_id):
    if 'logged_in' not in session:
        return redirect('/login')
    
    conn = sqlite3.connect('bot_data.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE applications SET status = 'rejected' WHERE id = ?", (app_id,))
    conn.commit()
    conn.close()
    
    return redirect('/')

@app.route('/api/stats')
def api_stats():
    """API для получения статистики"""
    return jsonify(get_stats())

@app.route('/api/applications')
def api_applications():
    """API для получения заявок"""
    return jsonify(get_applications())

if __name__ == '__main__':
    init_db()
    print("🌐 Веб-панель запущена на http://localhost:5000")
    print(f"📝 Логин: {ADMIN_USERNAME}")
    print(f"🔑 Пароль: {ADMIN_PASSWORD}")
    print("⚠️  ОБЯЗАТЕЛЬНО смените пароль в коде!")
    
    app.run(debug=True, host='0.0.0.0', port=5000)