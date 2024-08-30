const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  subscriptionId: { 
    type: String, 
    ref: 'Subscribe', // 关联到订阅表
    required: true
  },
  amount: { type: Number, required: true },
  planType: { // 将 planType 放在 Order 中
    type: String,
    enum: ['free', 'monthly', 'yearly'],
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: 'USD', // 默认币种
  },
  status: {
    type: String,
    enum: ["pending", "paid", "shipped", "completed", "cancelled"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'alipay', 'wechat', 'other'], // 支付方式
    required: true,
  },
  paymentDetails: {
    type: Map,
    of: String, // 存储支付相关的详细信息
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 索引优化
orderSchema.index({ userId: 1, status: 1 });

orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;