import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Breachwyre File Verifier
 * 
 * Standalone forensic utility for verifying the integrity of critical files.
 * Uses SHA-256 cryptographic hashing to ensure that files have not been tampered with
 * prior to or during a digital forensics and incident response (DFIR) investigation.
 */
public class FileVerifier {

    // Define standard exit codes for clear pipeline integration
    private static final int EXIT_SUCCESS = 0;
    private static final int EXIT_TAMPERED = 1;
    private static final int EXIT_ERROR = 1;

    public static void main(String[] args) {
        // Print the Breachwyre ASCII art banner to standard output
        printBanner();

        // 1. Accept two CLI args: file path and expected SHA-256 hash
        if (args.length != 2) {
            System.err.println("Usage: java FileVerifier <file_path> <expected_sha256_hash>");
            System.err.println("Example: java FileVerifier C:\\logs\\system.evtx e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
            System.exit(EXIT_ERROR);
        }

        String filePath = args[0];
        String expectedHash = args[1].toLowerCase().trim(); // Normalize the expected hash for comparison

        // Validate the expected hash format (must be 64 hexadecimal characters for SHA-256)
        if (!expectedHash.matches("^[a-f0-9]{64}$")) {
            System.err.println("Error: The provided expected hash is not a valid SHA-256 hash (must be 64 hex characters).");
            System.exit(EXIT_ERROR);
        }

        File file = new File(filePath);

        // 2. Validate the file exists and is readable
        // In forensic contexts, we must ensure we can actually access the target evidence
        if (!file.exists()) {
            System.err.println("Error: File does not exist at the specified path: " + filePath);
            System.exit(EXIT_ERROR);
        }

        if (!file.isFile()) {
            System.err.println("Error: The specified path is not a regular file (might be a directory): " + filePath);
            System.exit(EXIT_ERROR);
        }

        if (!file.canRead()) {
            System.err.println("Error: Insufficient permissions to read the file: " + filePath);
            System.exit(EXIT_ERROR);
        }

        try {
            // 3. Compute SHA-256 of the file using streaming
            String computedHash = computeSHA256(file).toLowerCase();

            // 4. Compare computed hash with expected hash (case-insensitive)
            // 5. Print result
            if (computedHash.equals(expectedHash)) {
                // The integrity of the file is maintained
                System.out.println("[VALID]    File integrity confirmed. Hash matches expected value.");
                System.out.println("           File: " + file.getAbsolutePath());
                System.out.println("           Expected: " + expectedHash);
                System.out.println("           Computed: " + computedHash);
                System.exit(EXIT_SUCCESS); // 6. Exit code 0 for VALID
            } else {
                // Potential tampering detected, crucial for chain of custody
                System.out.println("[TAMPERED] WARNING: File integrity COMPROMISED! Hash mismatch detected.");
                System.out.println("           File: " + file.getAbsolutePath());
                System.out.println("           Expected: " + expectedHash);
                System.out.println("           Computed: " + computedHash);
                System.out.println("           Action required: Treat file as forensic evidence - do not modify.");
                System.exit(EXIT_TAMPERED); // 6. Exit code 1 for TAMPERED
            }
        } catch (NoSuchAlgorithmException e) {
            // 7. Handle NoSuchAlgorithmException properly
            // This is a catastrophic failure if the JVM doesn't support SHA-256
            System.err.println("Critical Error: The JVM does not support the SHA-256 cryptographic algorithm.");
            System.err.println("Details: " + e.getMessage());
            System.exit(EXIT_ERROR);
        } catch (IOException e) {
            // 7. Handle IOException properly with descriptive error messages
            // IO issues during streaming could indicate disk failure or lock contention
            System.err.println("IO Error: Failed to read the file during hash computation.");
            System.err.println("Details: " + e.getMessage());
            System.exit(EXIT_ERROR);
        }
    }

    /**
     * Computes the SHA-256 hash of a file using a memory-efficient streaming approach.
     * 
     * Forensic Rationale:
     * Forensic artifacts (like memory dumps, disk images, or large log aggregates) can be
     * gigabytes or terabytes in size. Loading the entire file into memory (RAM) is infeasible
     * and can crash the analysis system (OOM errors). Using a fixed-size buffer to stream
     * the file through the MessageDigest ensures O(1) memory complexity regardless of file size.
     * 
     * @param file The file to hash.
     * @return The 64-character lowercase hexadecimal SHA-256 hash.
     * @throws IOException If an I/O error occurs reading the file.
     * @throws NoSuchAlgorithmException If the SHA-256 algorithm is not available.
     */
    public static String computeSHA256(File file) throws IOException, NoSuchAlgorithmException {
        // Initialize the cryptographic digest for SHA-256
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        
        // Use a standard 8KB buffer for optimal disk I/O performance
        byte[] buffer = new byte[8192];
        int bytesRead;

        // Use try-with-resources to guarantee the FileInputStream is closed,
        // preventing resource leaks which are critical in long-running DFIR processes.
        try (FileInputStream fis = new FileInputStream(file)) {
            // Stream the file contents through the digest
            while ((bytesRead = fis.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
        }

        // Finalize the hash computation
        byte[] hashBytes = digest.digest();
        
        // Convert the raw byte array into a hex string
        StringBuilder hexString = new StringBuilder();
        for (byte b : hashBytes) {
            // Convert each byte to a 2-character hex representation
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0'); // Pad single digit hex values with a leading zero
            }
            hexString.append(hex);
        }

        return hexString.toString();
    }

    /**
     * 8. Static printBanner() method showing ASCII art banner
     * 
     * Forensic Rationale:
     * Clear identification of the tool running in command-line environments helps analysts
     * maintain situational awareness and properly attribute output in investigation logs.
     */
    public static void printBanner() {
        System.out.println("===========================================================================");
        System.out.println("  ____                      _                           ");
        System.out.println(" |  _ \\                    | |                          ");
        System.out.println(" | |_) |_ __ ___  __ _  ___| |____      ___   _ _ __ ___ ");
        System.out.println(" |  _ <| '__/ _ \\/ _` |/ __| '_ \\ \\ /\\ / / | | | '__/ _ \\");
        System.out.println(" | |_) | | |  __/ (_| | (__| | | \\ V  V /| |_| | | |  __/");
        System.out.println(" |____/|_|  \\___|\\__,_|\\___|_| |_|\\_/\\_/  \\__, |_|  \\___|");
        System.out.println("                                           __/ |        ");
        System.out.println("                                          |___/         ");
        System.out.println(" Breachwyre DFIR Platform - Cryptographic File Verifier v1.0.0");
        System.out.println("===========================================================================");
    }
}
