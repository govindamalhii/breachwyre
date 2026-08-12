import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Breachwyre Log Analyzer
 * 
 * Standalone forensic utility for rapidly parsing and analyzing server logs for 
 * indicators of compromise (IoCs). Uses regex-based pattern matching and stream
 * processing to handle massive log files without memory exhaustion.
 */
public class LogAnalyzer {

    // Exit codes
    private static final int EXIT_CLEAN = 0;
    private static final int EXIT_ERROR = 1;
    private static final int EXIT_THREATS = 2;

    // ANSI Escape codes for colored console output
    private static final String ANSI_RESET = "\u001B[0m";
    private static final String ANSI_RED = "\u001B[31m";
    private static final String ANSI_YELLOW = "\u001B[33m";
    private static final String ANSI_CYAN = "\u001B[36m";
    private static final String ANSI_GREEN = "\u001B[32m";

    // 3. Detect threat patterns (case-insensitive regex)
    // Forensic Rationale: Regex patterns are compiled once statically to avoid
    // the severe performance penalty of compiling them for every single log line.
    private static final Map<String, Pattern> THREAT_PATTERNS = new HashMap<>();
    static {
        // SQL Injection attempts (common payloads)
        THREAT_PATTERNS.put("SQL_INJECTION", Pattern.compile("(?i)(SELECT.*FROM|INSERT.*INTO|DROP.*TABLE|UNION.*SELECT|OR.*1=1|'--)"));
        // Cross-Site Scripting (XSS) attacks
        THREAT_PATTERNS.put("XSS_ATTEMPT", Pattern.compile("(?i)(<script>|javascript:|onerror=|onload=|alert\\()"));
        // Directory Traversal / LFI
        THREAT_PATTERNS.put("PATH_TRAVERSAL", Pattern.compile("(?i)(\\.\\./|\\.\\.\\\\|%2e%2e|/etc/passwd|/windows/system32)"));
        // OS Command Injection
        THREAT_PATTERNS.put("COMMAND_INJECTION", Pattern.compile("(?i)(;ls|;cat|\\|bash|\\|sh|`whoami`|\\$\\(whoami\\))"));
        // Common attack tools and scanners
        THREAT_PATTERNS.put("SUSPICIOUS_USER_AGENT", Pattern.compile("(?i)(sqlmap|nikto|nmap|masscan|acunetix|burpsuite)"));
        // HTTP 403 Forbidden and 401 Unauthorized
        THREAT_PATTERNS.put("UNAUTHORIZED_ACCESS", Pattern.compile("(?i)(\\s403\\s|\\s401\\s)"));
    }

    // Pattern to extract IPv4 addresses for brute force tracking
    private static final Pattern IP_PATTERN = Pattern.compile("\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b");
    
    // Brute force threshold (5+ failed attempts)
    private static final int BRUTE_FORCE_THRESHOLD = 5;

    public static void main(String[] args) {
        if (args.length < 1 || args.length > 2) {
            System.err.println("Usage: java LogAnalyzer <log_file_path> [--report]");
            System.err.println("Example: java LogAnalyzer C:\\logs\\access.log --report");
            System.exit(EXIT_ERROR);
        }

        String logFilePath = args[0];
        boolean generateReport = (args.length == 2 && args[1].equalsIgnoreCase("--report"));

        File logFile = new File(logFilePath);
        if (!logFile.exists() || !logFile.isFile() || !logFile.canRead()) {
            System.err.println("Error: Cannot access log file at " + logFilePath);
            System.exit(EXIT_ERROR);
        }

        printBanner();

        // 4. Track: total lines scanned, threats by category, suspicious IPs, threat timeline
        long totalLines = 0;
        Map<String, Integer> threatCounts = new HashMap<>();
        Map<String, Integer> ipThreatCounts = new HashMap<>();
        Map<String, Integer> failedLoginsPerIp = new HashMap<>(); // For brute force tracking
        List<String> sampleMatches = new ArrayList<>();
        List<String> fullReportLines = new ArrayList<>();

        System.out.println(ANSI_CYAN + "Initializing forensic scan on: " + logFilePath + ANSI_RESET);
        System.out.println("Processing streams...");

        // 2. Stream-read the log file line by line
        // Forensic Rationale: Server logs can easily exceed RAM capacity. 
        // BufferedReader allows us to process logs of infinite size line-by-line.
        try (BufferedReader reader = new BufferedReader(new FileReader(logFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                totalLines++;
                boolean threatFoundOnLine = false;

                // Extract IP for tracking
                String extractedIp = extractIp(line);

                // Check standard threat patterns
                for (Map.Entry<String, Pattern> entry : THREAT_PATTERNS.entrySet()) {
                    String threatType = entry.getKey();
                    Pattern pattern = entry.getValue();
                    Matcher matcher = pattern.matcher(line);

                    if (matcher.find()) {
                        threatFoundOnLine = true;
                        threatCounts.put(threatType, threatCounts.getOrDefault(threatType, 0) + 1);
                        
                        if (extractedIp != null) {
                            ipThreatCounts.put(extractedIp, ipThreatCounts.getOrDefault(extractedIp, 0) + 1);
                        }

                        // Store sample matches for the report (limit to prevent memory bloat)
                        if (sampleMatches.size() < 20) {
                            sampleMatches.add(String.format("[%s] Line %d: %s", threatType, totalLines, line.trim()));
                        }
                        
                        if (generateReport) {
                            fullReportLines.add(String.format("Line %d | %s | IP: %s | Match: %s", 
                                totalLines, threatType, (extractedIp != null ? extractedIp : "UNKNOWN"), line.trim()));
                        }
                    }
                }

                // Check for Brute Force (simulated by counting 401s or failed auth indicators per IP)
                // In a real scenario, this regex would be tailored to the specific application's login failure format
                if (line.toLowerCase().contains("failed password") || line.toLowerCase().contains("authentication failure") || line.contains(" 401 ")) {
                    if (extractedIp != null) {
                        int fails = failedLoginsPerIp.getOrDefault(extractedIp, 0) + 1;
                        failedLoginsPerIp.put(extractedIp, fails);
                        
                        if (fails == BRUTE_FORCE_THRESHOLD) {
                            threatCounts.put("BRUTE_FORCE", threatCounts.getOrDefault("BRUTE_FORCE", 0) + 1);
                            ipThreatCounts.put(extractedIp, ipThreatCounts.getOrDefault(extractedIp, 0) + 1);
                            
                            if (sampleMatches.size() < 20) {
                                sampleMatches.add(String.format("[BRUTE_FORCE] Threshold reached for IP: %s at line %d", extractedIp, totalLines));
                            }
                            if (generateReport) {
                                fullReportLines.add(String.format("Line %d | BRUTE_FORCE | IP: %s | 5+ Failed Attempts Detected", totalLines, extractedIp));
                            }
                        }
                    }
                }
            }
        } catch (IOException e) {
            System.err.println(ANSI_RED + "Critical I/O Error during log analysis: " + e.getMessage() + ANSI_RESET);
            System.exit(EXIT_ERROR);
        }

        // Add residual brute force counts if they exceeded threshold before EOF
        // (Handled incrementally above)

        // 5. Print colored console report
        printConsoleReport(totalLines, threatCounts, ipThreatCounts, sampleMatches);

        // 6. If --report flag: write full findings
        if (generateReport) {
            writeReport(logFile.getName(), totalLines, threatCounts, ipThreatCounts, fullReportLines);
        }

        // 7. Exit code based on findings
        if (threatCounts.isEmpty()) {
            System.out.println(ANSI_GREEN + "\nScan Complete: No significant threats detected." + ANSI_RESET);
            System.exit(EXIT_CLEAN);
        } else {
            System.out.println(ANSI_RED + "\nScan Complete: Actionable threats detected. Review logs immediately." + ANSI_RESET);
            System.exit(EXIT_THREATS);
        }
    }

    private static String extractIp(String line) {
        Matcher matcher = IP_PATTERN.matcher(line);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private static void printBanner() {
        System.out.println(ANSI_CYAN);
        System.out.println("===========================================================================");
        System.out.println("  _                 _                _                     ");
        System.out.println(" | |               / \\   _ __   __ _| |_   _ _______ _ __  ");
        System.out.println(" | |      _____   / _ \\ | '_ \\ / _` | | | | |_  / _ \\ '__| ");
        System.out.println(" | |___  |_____| / ___ \\| | | | (_| | | |_| |/ /  __/ |    ");
        System.out.println(" |_____|        /_/   \\_\\_| |_|\\__,_|_|\\__, /___\\___|_|    ");
        System.out.println("                                       |___/               ");
        System.out.println(" Breachwyre DFIR Platform - Forensic Log Analyzer v1.0.0");
        System.out.println("===========================================================================");
        System.out.print(ANSI_RESET);
    }

    private static void printConsoleReport(long totalLines, Map<String, Integer> threatCounts, 
                                           Map<String, Integer> ipThreatCounts, List<String> sampleMatches) {
        System.out.println("\n" + ANSI_YELLOW + "--- SCAN SUMMARY ---" + ANSI_RESET);
        System.out.println("Total Lines Scanned: " + totalLines);
        
        System.out.println("\n" + ANSI_YELLOW + "--- THREAT CATEGORIES ---" + ANSI_RESET);
        if (threatCounts.isEmpty()) {
            System.out.println(ANSI_GREEN + "No threat patterns matched." + ANSI_RESET);
        } else {
            System.out.printf("%-25s | %-10s | %-15s%n", "Threat Type", "Count", "Risk Level");
            System.out.println("---------------------------------------------------------");
            for (Map.Entry<String, Integer> entry : threatCounts.entrySet()) {
                String type = entry.getKey();
                int count = entry.getValue();
                String risk = getRiskLevel(type);
                String riskColor = risk.equals("CRITICAL") || risk.equals("HIGH") ? ANSI_RED : ANSI_YELLOW;
                
                System.out.printf("%-25s | %-10d | %s%s%s%n", type, count, riskColor, risk, ANSI_RESET);
            }
        }

        System.out.println("\n" + ANSI_YELLOW + "--- TOP SUSPICIOUS IPs ---" + ANSI_RESET);
        if (ipThreatCounts.isEmpty()) {
             System.out.println(ANSI_GREEN + "No suspicious IPs identified." + ANSI_RESET);
        } else {
            // Sort by count descending and take top 5
            ipThreatCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .forEach(e -> System.out.printf("IP: %-15s | Threat Events: %d%n", e.getKey(), e.getValue()));
        }

        System.out.println("\n" + ANSI_YELLOW + "--- SAMPLE MATCHES ---" + ANSI_RESET);
        for (String sample : sampleMatches) {
            System.out.println(ANSI_RED + sample + ANSI_RESET);
        }
    }

    private static String getRiskLevel(String threatType) {
        switch (threatType) {
            case "COMMAND_INJECTION":
            case "SQL_INJECTION":
            case "PATH_TRAVERSAL":
                return "CRITICAL";
            case "XSS_ATTEMPT":
            case "BRUTE_FORCE":
                return "HIGH";
            case "SUSPICIOUS_USER_AGENT":
            case "UNAUTHORIZED_ACCESS":
                return "MEDIUM";
            default:
                return "LOW";
        }
    }

    /**
     * Writes a detailed forensic report to disk.
     * 
     * Forensic Rationale:
     * Analysts need immutable, timestamped records of findings for incident reports
     * and potential legal proceedings. This report captures the state of the analysis.
     */
    private static void writeReport(String originalFileName, long totalLines, Map<String, Integer> threatCounts, 
                                    Map<String, Integer> ipThreatCounts, List<String> fullReportLines) {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
        String timestamp = dtf.format(LocalDateTime.now());
        String reportFileName = String.format("%s_breachwyre_report_%s.txt", originalFileName, timestamp);
        
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(reportFileName))) {
            writer.write("=========================================================\n");
            writer.write(" BREACHWYRE LOG ANALYSIS REPORT\n");
            writer.write(" Generated: " + LocalDateTime.now().toString() + "\n");
            writer.write(" Target File: " + originalFileName + "\n");
            writer.write(" Total Lines Scanned: " + totalLines + "\n");
            writer.write("=========================================================\n\n");

            writer.write("--- THREAT SUMMARY ---\n");
            for (Map.Entry<String, Integer> entry : threatCounts.entrySet()) {
                writer.write(String.format("%s: %d\n", entry.getKey(), entry.getValue()));
            }

            writer.write("\n--- ALL DETECTED EVENTS ---\n");
            for (String line : fullReportLines) {
                writer.write(line + "\n");
            }

            System.out.println(ANSI_CYAN + "\n[+] Detailed forensic report written to: " + reportFileName + ANSI_RESET);

        } catch (IOException e) {
            System.err.println(ANSI_RED + "Error writing report file: " + e.getMessage() + ANSI_RESET);
        }
    }
}
