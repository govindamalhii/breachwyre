const crypto = require('crypto');
const fs = require('fs');

/**
 * Hash File Stream
 * Generates a SHA-256 hash from a file using streams.
 * Security Rationale: Streaming the file through a hash function prevents memory overload
 * when processing large forensic evidence files. We never load the entire file into memory.
 * 
 * @param {string} filePath - Absolute or relative path to the file.
 * @returns {Promise<string>} - Resolves with the hexadecimal representation of the hash.
 */
const hashFileStream = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('error', (err) => {
            reject(err);
        });

        stream.on('data', (chunk) => {
            hash.update(chunk);
        });

        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });
    });
};

/**
 * Hash Buffer
 * Generates a synchronous SHA-256 hash for a given buffer in memory.
 * Suitable for smaller chunks of data or small files already loaded into memory.
 * 
 * @param {Buffer} buffer - Data buffer to hash.
 * @returns {string} - Hexadecimal representation of the hash.
 */
const hashBuffer = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Verify File Hash
 * Streams a file to compute its hash and compares it against an expected hash.
 * 
 * @param {string} filePath - Path to the file.
 * @param {string} expectedHash - The expected SHA-256 hash in hex format.
 * @returns {Promise<boolean>} - True if matches, false otherwise.
 */
const verifyFileHash = async (filePath, expectedHash) => {
    try {
        const computedHash = await hashFileStream(filePath);
        // Using crypto.timingSafeEqual prevents timing attacks when comparing hashes
        return crypto.timingSafeEqual(
            Buffer.from(computedHash, 'hex'),
            Buffer.from(expectedHash, 'hex')
        );
    } catch (error) {
        console.error('Error verifying file hash:', error);
        return false;
    }
};

module.exports = {
    hashFileStream,
    hashBuffer,
    verifyFileHash
};
