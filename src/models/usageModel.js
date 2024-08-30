const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usageSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // 外键引用用户
    date: { type: Date, default: Date.now }, // 记录的日期
    usageCount: { type: Number, default: 0 }, // 当天的接口调用次数
  });
  
  const Usage = mongoose.model('Usage', usageSchema);
  
  module.exports = Usage;
  