const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subscribeId: {
    type: Schema.Types.ObjectId,
    ref: "Subscribe",
    required: true,
  },
  planType: { type: String, enum: ["monthly", "yearly"], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: "CNY" },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'alipay'],
    required: true
  },
  stripePaymentIntentId: { type: String },
  alipayTradeNo: { type: String },
  alipayBuyerId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.model("Order", orderSchema);
