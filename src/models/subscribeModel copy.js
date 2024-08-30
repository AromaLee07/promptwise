const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscribeSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // 外键引用用户
    planType: { type: String, enum: ['monthly', 'yearly'], required: true }, // 订阅类型
    startDate: { type: Date, required: true }, // 订阅开始日期
    endDate: { type: Date, required: true }, // 订阅结束日期
    isActive: { type: Boolean, default: true }, // 订阅是否有效
    paymentMethod: {
      type: String,
      enum: ['stripe', 'alipay'],
      required: true
    },
    stripeSubscriptionId: { type: String },
    alipayTradeNo: { type: String },
  });
  
  subscribeSchema.pre('save', function(next) {
    const now = new Date();
    if (this.endDate <= now) {
      this.isActive = false; // 订阅到期时设置为无效
    }
    next();
  });
  
  const Subscribe = mongoose.model('Subscribe', subscribeSchema);
  
  module.exports = Subscribe;
  