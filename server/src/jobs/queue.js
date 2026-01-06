/**
 * Queue Configuration with Bull
 * Supports both Redis and in-memory modes
 */

const Queue = require('bull');

// Redis configuration (optional - Bull can work with in-memory)
const redisConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Don't fail if Redis is not available - Bull will fall back to in-memory
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('Redis connection failed after 3 attempts, using in-memory mode');
        return null;
      }
      return Math.min(times * 100, 3000);
    }
  }
};

// Default job options
const defaultJobOptions = {
  attempts: 3, // Retry failed jobs up to 3 times
  backoff: {
    type: 'exponential',
    delay: 5000 // Start with 5 second delay, doubles each retry
  },
  removeOnComplete: {
    age: 86400, // Keep completed jobs for 24 hours
    count: 1000 // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 604800 // Keep failed jobs for 7 days
  }
};

// Frame Extraction Queue
const frameExtractionQueue = new Queue('frame-extraction', redisConfig);

// Analysis Queue (for future use with frame analysis)
const analysisQueue = new Queue('frame-analysis', redisConfig);

// Queue event handlers for monitoring
frameExtractionQueue.on('error', (error) => {
  console.error('Frame Extraction Queue Error:', error);
});

frameExtractionQueue.on('waiting', (jobId) => {
  console.log(`Frame extraction job ${jobId} is waiting`);
});

frameExtractionQueue.on('active', (job) => {
  console.log(`Frame extraction job ${job.id} started processing`);
});

frameExtractionQueue.on('completed', (job, result) => {
  console.log(`Frame extraction job ${job.id} completed successfully`);
});

frameExtractionQueue.on('failed', (job, err) => {
  console.error(`Frame extraction job ${job.id} failed:`, err.message);
});

analysisQueue.on('error', (error) => {
  console.error('Analysis Queue Error:', error);
});

// Health check function
async function getQueueHealth() {
  try {
    const frameStats = {
      waiting: await frameExtractionQueue.getWaitingCount(),
      active: await frameExtractionQueue.getActiveCount(),
      completed: await frameExtractionQueue.getCompletedCount(),
      failed: await frameExtractionQueue.getFailedCount(),
      delayed: await frameExtractionQueue.getDelayedCount()
    };

    const analysisStats = {
      waiting: await analysisQueue.getWaitingCount(),
      active: await analysisQueue.getActiveCount(),
      completed: await analysisQueue.getCompletedCount(),
      failed: await analysisQueue.getFailedCount(),
      delayed: await analysisQueue.getDelayedCount()
    };

    return {
      frameExtraction: frameStats,
      analysis: analysisStats,
      healthy: true
    };
  } catch (error) {
    console.error('Queue health check failed:', error);
    return {
      healthy: false,
      error: error.message
    };
  }
}

// Clean up old jobs periodically
async function cleanOldJobs() {
  try {
    await frameExtractionQueue.clean(86400000, 'completed'); // 24 hours
    await frameExtractionQueue.clean(604800000, 'failed'); // 7 days
    await analysisQueue.clean(86400000, 'completed');
    await analysisQueue.clean(604800000, 'failed');
    console.log('Queue cleanup completed');
  } catch (error) {
    console.error('Queue cleanup failed:', error);
  }
}

// Run cleanup every hour
setInterval(cleanOldJobs, 3600000);

// Graceful shutdown
async function closeQueues() {
  console.log('Closing queues...');
  await frameExtractionQueue.close();
  await analysisQueue.close();
  console.log('Queues closed');
}

module.exports = {
  frameExtractionQueue,
  analysisQueue,
  defaultJobOptions,
  getQueueHealth,
  closeQueues
};
