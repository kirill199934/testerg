import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitRunnable;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;

public class TravHouseAPIPlugin extends JavaPlugin {
    
    private SimpleHTTPServer httpServer;
    private int port = 8080;
    private long serverStartTime;
    
    @Override
    public void onEnable() {
        serverStartTime = System.currentTimeMillis();
        
        // Загружаем конфигурацию
        saveDefaultConfig();
        port = getConfig().getInt("port", 8080);
        
        // Запускаем HTTP сервер
        try {
            httpServer = new SimpleHTTPServer(this, port);
            httpServer.start();
            getLogger().info("TravHouse API started on port " + port);
        } catch (Exception e) {
            getLogger().severe("Failed to start HTTP server: " + e.getMessage());
        }
        
        getLogger().info("TravHouse API plugin enabled!");
    }
    
    @Override
    public void onDisable() {
        if (httpServer != null) {
            httpServer.stop();
        }
        getLogger().info("TravHouse API plugin disabled!");
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (command.getName().equalsIgnoreCase("thapi")) {
            if (!sender.hasPermission("travhouse.admin")) {
                sender.sendMessage("§cNo permission!");
                return true;
            }
            
            if (args.length == 0 || args[0].equalsIgnoreCase("status")) {
                sender.sendMessage("§b=== TravHouse API Status ===");
                sender.sendMessage("§7Port: §f" + port);
                sender.sendMessage("§7Players: §f" + Bukkit.getOnlinePlayers().size() + "/" + Bukkit.getMaxPlayers());
                sender.sendMessage("§7API URL: §fhttp://localhost:" + port + "/api/");
                return true;
            }
            
            if (args[0].equalsIgnoreCase("reload")) {
                reloadConfig();
                sender.sendMessage("§aConfig reloaded!");
                return true;
            }
        }
        
        return false;
    }
    
    public long getUptimeSeconds() {
        return (System.currentTimeMillis() - serverStartTime) / 1000;
    }
    
    public double getTPS() {
        try {
            Object server = Bukkit.getServer().getClass().getMethod("getServer").invoke(Bukkit.getServer());
            double[] tps = (double[]) server.getClass().getField("recentTps").get(server);
            return Math.min(20.0, tps[0]);
        } catch (Exception e) {
            return 20.0; // fallback
        }
    }
}

class SimpleHTTPServer {
    private ServerSocket serverSocket;
    private ExecutorService executor;
    private TravHouseAPIPlugin plugin;
    private boolean running = false;
    
    public SimpleHTTPServer(TravHouseAPIPlugin plugin, int port) throws IOException {
        this.plugin = plugin;
        this.serverSocket = new ServerSocket(port);
        this.executor = Executors.newFixedThreadPool(4);
    }
    
    public void start() {
        running = true;
        new Thread(() -> {
            while (running) {
                try {
                    java.net.Socket clientSocket = serverSocket.accept();
                    executor.submit(() -> handleRequest(clientSocket));
                } catch (IOException e) {
                    if (running) {
                        plugin.getLogger().warning("Error accepting connection: " + e.getMessage());
                    }
                }
            }
        }).start();
    }
    
    public void stop() {
        running = false;
        try {
            if (serverSocket != null) {
                serverSocket.close();
            }
            if (executor != null) {
                executor.shutdown();
            }
        } catch (IOException e) {
            plugin.getLogger().warning("Error stopping server: " + e.getMessage());
        }
    }
    
    private void handleRequest(java.net.Socket clientSocket) {
        try (java.io.BufferedReader in = new java.io.BufferedReader(
                new java.io.InputStreamReader(clientSocket.getInputStream()));
             OutputStream out = clientSocket.getOutputStream()) {
            
            String requestLine = in.readLine();
            if (requestLine == null) return;
            
            // Простой парсинг HTTP запроса
            String[] parts = requestLine.split(" ");
            if (parts.length < 2) return;
            
            String method = parts[0];
            String path = parts[1];
            
            // CORS headers
            String corsHeaders = "Access-Control-Allow-Origin: *\r\n" +
                               "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" +
                               "Access-Control-Allow-Headers: Content-Type\r\n";
            
            if ("OPTIONS".equals(method)) {
                String response = "HTTP/1.1 200 OK\r\n" + corsHeaders + "\r\n";
                out.write(response.getBytes());
                return;
            }
            
            String jsonResponse = "";
            
            // API маршруты
            if (path.startsWith("/api/status")) {
                jsonResponse = getStatusJson();
            } else if (path.startsWith("/api/players")) {
                jsonResponse = getPlayersJson();
            } else if (path.startsWith("/api/performance")) {
                jsonResponse = getPerformanceJson();
            } else if (path.startsWith("/api/health")) {
                jsonResponse = getHealthJson();
            } else {
                jsonResponse = "{\"error\": \"Not found\"}";
            }
            
            String response = "HTTP/1.1 200 OK\r\n" +
                            corsHeaders +
                            "Content-Type: application/json; charset=utf-8\r\n" +
                            "Content-Length: " + jsonResponse.getBytes(StandardCharsets.UTF_8).length + "\r\n" +
                            "\r\n" + jsonResponse;
            
            out.write(response.getBytes(StandardCharsets.UTF_8));
            
        } catch (IOException e) {
            plugin.getLogger().warning("Error handling request: " + e.getMessage());
        } finally {
            try {
                clientSocket.close();
            } catch (IOException e) {
                // ignore
            }
        }
    }
    
    private String getStatusJson() {
        int online = Bukkit.getOnlinePlayers().size();
        int max = Bukkit.getMaxPlayers();
        long uptime = plugin.getUptimeSeconds();
        
        return String.format("{" +
            "\"online\": true," +
            "\"players\": {\"online\": %d, \"max\": %d}," +
            "\"version\": \"%s\"," +
            "\"server_type\": \"%s\"," +
            "\"uptime\": %d," +
            "\"source\": \"travhouse-plugin\"" +
            "}", online, max, Bukkit.getVersion(), Bukkit.getName(), uptime);
    }
    
    private String getPlayersJson() {
        StringBuilder players = new StringBuilder("[");
        boolean first = true;
        for (Player player : Bukkit.getOnlinePlayers()) {
            if (!first) players.append(",");
            players.append("\"").append(player.getName()).append("\"");
            first = false;
        }
        players.append("]");
        
        return String.format("{" +
            "\"online\": %d," +
            "\"max\": %d," +
            "\"players\": %s" +
            "}", Bukkit.getOnlinePlayers().size(), Bukkit.getMaxPlayers(), players.toString());
    }
    
    private String getPerformanceJson() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
        
        long usedMemory = heapUsage.getUsed() / (1024 * 1024);
        long maxMemory = heapUsage.getMax() / (1024 * 1024);
        double memoryPercent = (double) usedMemory / maxMemory * 100;
        
        double tps = plugin.getTPS();
        double mspt = tps > 0 ? (1000.0 / tps) : 50.0;
        
        return String.format("{" +
            "\"tps\": %.1f," +
            "\"mspt\": %.1f," +
            "\"memory_used\": %d," +
            "\"memory_total\": %d," +
            "\"memory_percent\": %.1f," +
            "\"source\": \"travhouse-plugin\"" +
            "}", tps, mspt, usedMemory, maxMemory, memoryPercent);
    }
    
    private String getHealthJson() {
        return String.format("{" +
            "\"status\": \"OK\"," +
            "\"plugin\": \"TravHouse API v1.0\"," +
            "\"timestamp\": %d," +
            "\"uptime_seconds\": %d" +
            "}", System.currentTimeMillis(), plugin.getUptimeSeconds());
    }
}