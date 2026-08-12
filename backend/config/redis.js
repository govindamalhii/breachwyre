const redis = require('redis');

/**
 * Redis Client Configuration
 */
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Flag to track connection status
let isConnected = false;

// Event Listeners for robust error handling and monitoring
client.on('connect', () => {
    console.log('Redis client attempting connection...');
});

client.on('ready', () => {
    isConnected = true;
    console.log('Redis client successfully connected and ready.');
});

client.on('error', (err) => {
    console.error('Redis Client Error:', err);
    // Graceful degradation: we don't crash the app on Redis errors, 
    // we just log it. Services relying on Redis should check `client.isReady`.
});

client.on('reconnecting', () => {
    console.log('Redis client reconnecting...');
});

client.on('end', () => {
    isConnected = false;
    console.log('Redis connection closed.');
});

/**
 * Connect to Redis gracefully
 * This function should be called during app initialization.
 */
const connectRedis = async () => {
    try {
        await client.connect();
    } catch (err) {
        console.error('Initial Redis connection failed (app will continue without Redis):', err.message);
        // We do NOT re-throw here to allow app boot without Redis (e.g. for dev/testing)
    }
};

module.exports = {
    client,
    connectRedis,
    getIsConnected: () => isConnected
};
