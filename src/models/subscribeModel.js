const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subscribeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      sparse: true,
    },
    stripeSubscriptionId: {
      type: String,
      sparse: true,
      unique: true,
    },
    planType: {
      type: String,
      enum: ["free", "monthly", "yearly"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "paused", "cancelled", "expired"],
      default: "pending",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    paymentHistory: {
      type: [
      {
        method: {
          type: String,
          enum: ["stripe", "alipay", "wechat", "other"],
          required: false,
        },
        amount: {
          type: Number,
          required: true,
        },
        currency: {
          type: String,
          required: true,
          default: "USD",
        },
        paymentDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "succeeded", "failed", "refunded"],
          default: "pending",
        },
        metadata: {
          type: Map,
          of: String,
        },
        startDate: {
          type: Date,
          required: true, // 订阅开始日期
        },
        endDate: {
          type: Date,
          required: true, // 订阅结束日期
        },
        subscriptionId: {
          type: Schema.Types.ObjectId,
          ref: 'Subscribe', // 关联到订阅模型
          required: true,
        },
        transactionId: {
          type: String,
          required: true, // 支付处理的唯一交易 ID
        },
        description: {
          type: String,
          required: false, // 支付描述
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        invoiceId: {
          type: String, // Stripe 发票 ID
          required: true,
        },
      },
    ],
    default: [],
  },

    

    latestInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

// 索引优化
subscribeSchema.index({ userId: 1, status: 1 });
subscribeSchema.index({ currentPeriodEnd: 1 }, { expireAfterSeconds: 0 });

// 中间件：检查订阅是否过期
subscribeSchema.pre("save", function (next) {
  const now = new Date();
  if (this.currentPeriodEnd <= now && this.status === "active") {
    this.status = "expired";
  }
  next();
});

// 方法：检查订阅是否活跃
subscribeSchema.methods.isActive = function () {
  return this.status === "active" && this.currentPeriodEnd > new Date();
};

// 静态方法：获取用户的活跃订阅
subscribeSchema.statics.getActiveSubscription = function (userId) {
  return this.findOne({ userId: userId, status: "active" });
};

// 虚拟字段 userId
subscribeSchema.virtual("subscriptionId").get(function () {
  return this._id.toHexString();
});

subscribeSchema.set("toJSON", {
  virtuals: true,
});

const Subscribe = mongoose.model("Subscribe", subscribeSchema);

module.exports = Subscribe;
