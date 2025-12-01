package com.travhouse.api;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.World;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;

public class HTTPServer {
    
    private HttpServer server;
    private TravHouseAPIPlugin plugin;
    private boolean running = false;
    
    public HTTPServer(TravHouseAPIPlugin plugin, int port) throws IOException {
        this.plugin = plugin;
        this.server = HttpServer.create(new InetSocketAddress(port), 0);
        setupRoutes();
    }
    
    private void setupRoutes() {
        // CORS Handler для всех маршрутов
        server.createContext("/api/", new CORSHandler());
        
        // API маршруты
        server.createContext("/api/status", new StatusHandler());
        server.createContext("/api/players", new PlayersHandler());
        server.createContext("/api/performance", new PerformanceHandler());
        server.createContext("/api/world", new WorldHandler());
        server.createContext("/api/server-info", new ServerInfoHandler());
        server.createContext("/api/health", new HealthHandler());
    }
    
    public void start() {
        server.setExecutor(Executors.newFixedThreadPool(4));
        server.start();
        running = true;
    }
    
    public void stop() {
        if (server != null) {
            server.stop(0);
            running = false;
        }
    }
    
    public boolean isRunning() {
        return running;
    }
    
    // CORS Handler
    private class CORSHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Добавляем CORS заголовки
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
            
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(200, 0);
                exchange.close();
                return;
            }
            
            // Если это не OPTIONS, передаем дальше
            String response = "{\"message\": \"TravHouse API v1.0\", \"endpoints\": [\"/status\", \"/players\", \"/performance\", \"/world\", \"/server-info\", \"/health\"]}";
            sendJsonResponse(exchange, 200, response);
        }
    }
    
    // Статус сервера
    private class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCORSHeaders(exchange);
            
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(200, 0);
                exchange.close();
                return;
            }
            
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"online\": true,");
            json.append("\"players\": {");
            json.append("\"online\": ").append(Bukkit.getOnlinePlayers().size()).append(",");
            json.append("\"max\": ").append(Bukkit.getMaxPlayers());
            json.append("},");
            json.append("\"version\": \"").append(Bukkit.getVersion()).append("\",");
            json.append("\"server_type\": \"").append(Bukkit.getName()).append("\",");
            json.append("\"uptime\": ").append(plugin.getUptimeSeconds()).append(",");
            json.append("\"motd\": \"").append(Bukkit.getMotd()).append("\",");
            json.append("\"source\": \"travhouse-plugin\",");
            json.append("\"timestamp\": \"").append(System.currentTimeMillis()).append("\"");
            json.append("}");
            
            sendJsonResponse(exchange, 200, json.toString());
        }
    }
    
    // Список игроков
    private class PlayersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCORSHeaders(exchange);
            
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(200, 0);
                exchange.close();
                return;
            }
            
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"online\": ").append(Bukkit.getOnlinePlayers().size()).append(",");
            json.append("\"max\": ").append(Bukkit.getMaxPlayers()).append(",");
            json.append("\"players\": [");
            
            boolean first = true;
            for (Player player : Bukkit.getOnlinePlayers()) {
                if (!first) json.append(",");
                json.append("\"").append(player.getName()).append("\"");
                first = false;
            }
            
            json.append("]}");
            
            sendJsonResponse(exchange, 200, json.toString());
        }
    }
    
    // Производительность сервера
    private class PerformanceHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCORSHeaders(exchange);
            
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(200, 0);
                exchange.close();
                return;
            }
            
            // Получаем информацию о памяти
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
            MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
            
            long usedMemory = heapUsage.getUsed() / (1024 * 1024); // В МБ
            long maxMemory = heapUsage.getMax() / (1024 * 1024); // В МБ
            double memoryPercent = (double) usedMemory / maxMemory * 100;
            
            // Приблизительный MSPT (50ms = 1 tick, 20 TPS = 20 ticks/sec)
            double tps = plugin.getTPS();
            double mspt = tps > 0 ? (1000.0 / tps) : 50.0;
            
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"tps\": ").append(String.format("%.1f", tps)).append(",");
            json.append("\"mspt\": ").append(String.format("%.1f", mspt)).append(",");
            json.append("\"memory_used\": ").append(usedMemory).append(",");
            json.append("\"memory_total\": ").append(maxMemory).append(",");
            json.append("\"memory_percent\": ").append(String.format("%.1f", memoryPercent)).append(",");
            json.append("\"source\": \"travhouse-plugin\",");
            json.append("\"timestamp\": \"").append(System.currentTimeMillis()).append("\"");
            json.append("}");
            
            sendJsonResponse(exchange, 200, json.toString());
        }
    }
    
    // Информация о мирах
    private class WorldHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCORSHeaders(exchange);
            
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(200, 0);
                exchange.close();
                return;
            }
            
            StringBuilder json = new StringBuilder();
            json.append("{\"worlds\": [");
            
            boolean first = true;
            for (World world : Bukkit.getWorlds()) {
                if (!first) json.append(",");
                json.append("{");
                json.append("\"name\": \"").append(world.getName()).append("\",");
                json.append("\"environment\": \"").append(world.getEnvironment().name()).append("\",");
                json.append("\"players\": ").append(world.getPlayers().size()).append(",");
                json.append("\"loaded_chunks\": ").append(world.getLoadedChunks().length).append(",");
                json.append("\"entities\": ").append(world.getEntities().size());
                json.append("}");
                first = false;
            }
            
            json.append("]}");
            
            sendJsonResponse(exchange, 200, json.toString());
        }
    }
    
    // Подробная информация о сервере
    private class ServerInfoHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCORSHeaders(exchange);
            
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(200, 0);
                exchange.close();
                return;
            }
            
            Runtime runtime = Runtime.getRuntime();
            
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"server_name\": \"").append(Bukkit.getName()).append("\",");
            json.append("\"version\": \"").append(Bukkit.getVersion()).append("\",");
            json.append("\"bukkit_version\": \"").append(Bukkit.getBukkitVersion()).append("\",");
            json.append("\"java_version\": \"").append(System.getProperty("java.version")).append("\",");
            json.append("\"operating_system\": \"").append(System.getProperty("os.name")).append("\",");
            json.append("\"cpu_cores\": ").append(runtime.availableProcessors()).append(",");
            json.append("\"max_players\": ").append(Bukkit.getMaxPlayers()).append(",");
            json.append("\"view_distance\": ").append(Bukkit.getViewDistance()).append(",");
            json.append("\"simulation_distance\": ").append(Bukkit.getSimulationDistance()).append(",");
            json.append("\"plugins_count\": ").append(Bukkit.getPluginManager().getPlugins().length).append(",");
            json.append("\"worlds_count\": ").append(Bukkit.getWorlds().size());
            json.append("}");
            
            sendJsonResponse(exchange, 200, json.toString());
        }
    }
    
    // Проверка здоровья API
    private class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCORSHeaders(exchange);
            
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(200, 0);
                exchange.close();
                return;
            }
            
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"status\": \"OK\",");
            json.append("\"plugin\": \"TravHouse API v1.0\",");
            json.append("\"timestamp\": \"").append(System.currentTimeMillis()).append("\",");
            json.append("\"uptime_seconds\": ").append(plugin.getUptimeSeconds());
            json.append("}");
            
            sendJsonResponse(exchange, 200, json.toString());
        }
    }
    
    // Вспомогательные методы
    private void addCORSHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }
    
    private void sendJsonResponse(HttpExchange exchange, int statusCode, String json) throws IOException {
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
        byte[] response = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, response.length);
        
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response);
        }
    }
}