const Queue = require('bull');
// const subscribeController = require('../controllers/subscribeController');

const subscribeController = require('../api/controllers/subscribeController');
const config = require('../config'); // 假设你有一个配置文件

// 创建队列实例
const subscriptionQueue = new Queue('subscription-queue', config.redisUrl);

// 配置队列处理器
subscriptionQueue.process('createSubscription', async (job) => {
  try {
    await subscribeController.create(job.data);
  } catch (error) {
    console.error('Subscription creation failed:', error);
    // 错误处理逻辑
  }
});

// 你可以在这里添加更多的队列和处理器

module.exports = {
  subscriptionQueue,
  // 如果有其他队列，也可以在这里导出
};