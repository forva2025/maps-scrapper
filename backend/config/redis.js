const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis;

const connectRedis = async () => {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    await redis.connect();
    return redis;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

const getRedis = () => {
  if (!redis) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redis;
};

const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    logger.info('Redis connection closed');
  }
};

module.exports = {
  connectRedis,
  getRedis,
  closeRedis
};