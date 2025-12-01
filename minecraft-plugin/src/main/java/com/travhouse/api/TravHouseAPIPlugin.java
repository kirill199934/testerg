package com.travhouse.api;

import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

public class TravHouseAPIPlugin extends JavaPlugin {
    
    private HTTPServer httpServer;
    private int port = 8080; // Порт по умолчанию
    private long serverStartTime;
    
    @Override
    public void onEnable() {
        // Сохраняем время запуска сервера
        serverStartTime = System.currentTimeMillis();
        
        // Загружаем конфигурацию
        saveDefaultConfig();
        port = getConfig().getInt("api.port", 8080);
        
        // Запускаем HTTP сервер
        try {
            httpServer = new HTTPServer(this, port);
            httpServer.start();
            getLogger().info("TravHouse API запущен на порту " + port);
            getLogger().info("Доступ к API: http://localhost:" + port + "/api/");
        } catch (Exception e) {
            getLogger().severe("Ошибка запуска HTTP сервера: " + e.getMessage());
            e.printStackTrace();
        }
        
        getLogger().info("TravHouse API плагин успешно загружен!");
    }
    
    @Override
    public void onDisable() {
        // Останавливаем HTTP сервер
        if (httpServer != null) {
            httpServer.stop();
            getLogger().info("HTTP сервер остановлен");
        }
        
        getLogger().info("TravHouse API плагин выгружен!");
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (command.getName().equalsIgnoreCase("thapi")) {
            if (!sender.hasPermission("travhouse.admin")) {
                sender.sendMessage("§cУ вас нет прав для использования этой команды!");
                return true;
            }
            
            if (args.length == 0) {
                sender.sendMessage("§b=== TravHouse API ===");
                sender.sendMessage("§7Версия: " + getDescription().getVersion());
                sender.sendMessage("§7Порт: " + port);
                sender.sendMessage("§7Статус: " + (httpServer != null && httpServer.isRunning() ? "§aРаботает" : "§cОстановлен"));
                sender.sendMessage("§7URL: §fhttp://localhost:" + port + "/api/");
                sender.sendMessage("§7Команды: §f/thapi <reload|status|port>");
                return true;
            }
            
            switch (args[0].toLowerCase()) {
                case "reload":
                    reloadConfig();
                    sender.sendMessage("§aКонфигурация перезагружена!");
                    break;
                    
                case "status":
                    sender.sendMessage("§b=== Статус API ===");
                    sender.sendMessage("§7HTTP Сервер: " + (httpServer != null && httpServer.isRunning() ? "§aРабочий" : "§cОстановлен"));
                    sender.sendMessage("§7Порт: §f" + port);
                    sender.sendMessage("§7Игроков онлайн: §f" + Bukkit.getOnlinePlayers().size());
                    sender.sendMessage("§7Макс. игроков: §f" + Bukkit.getMaxPlayers());
                    break;
                    
                case "port":
                    if (args.length > 1) {
                        try {
                            int newPort = Integer.parseInt(args[1]);
                            getConfig().set("api.port", newPort);
                            saveConfig();
                            sender.sendMessage("§aПорт изменен на " + newPort + ". Перезагрузите плагин для применения.");
                        } catch (NumberFormatException e) {
                            sender.sendMessage("§cНеверный номер порта!");
                        }
                    } else {
                        sender.sendMessage("§7Текущий порт: §f" + port);
                    }
                    break;
                    
                default:
                    sender.sendMessage("§cНеизвестная команда! Используйте: /thapi <reload|status|port>");
                    break;
            }
            
            return true;
        }
        
        return false;
    }
    
    // Получить время работы сервера в секундах
    public long getUptimeSeconds() {
        return (System.currentTimeMillis() - serverStartTime) / 1000;
    }
    
    // Получить TPS сервера (приблизительно)
    public double getTPS() {
        try {
            // Используем Reflection для получения TPS
            Object server = Bukkit.getServer().getClass().getMethod("getServer").invoke(Bukkit.getServer());
            double[] tps = (double[]) server.getClass().getField("recentTps").get(server);
            return Math.min(20.0, tps[0]);
        } catch (Exception e) {
            // Fallback - возвращаем 20.0 если не удалось получить реальный TPS
            return 20.0;
        }
    }
}