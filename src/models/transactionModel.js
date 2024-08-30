const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 交易表
const transactionSchema = Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  transactionId: {
    type: String,
    required: true, // 支付平台返回的交易 ID
  },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  amount: { type: Number, required: true },
  currency: {
    type: String,
    required: true,
    default: "USD", // 默认币种
  },
  type: {
    type: String,
    enum: ['payment', 'refund'],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", 'completed', 'failed'],
    default: "pending", // 交易状态
  },
  paymentMethod: {
    type: String,
    enum: ["stripe", "alipay", "wechat", "other"], // 支付方式
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: {
    type: Date,
    default: Date.now, // 交易更新时间
  },
});

// 索引优化
transactionSchema.index({ orderId: 1, status: 1 });

transactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
