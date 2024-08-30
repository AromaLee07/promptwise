// src/api/controllers/userController.js
const User = require("../../models/userModel");
const Click = require("../../models/clickModel"); // 稍后创建

const Subscribe = require("../../models/subscribeModel");

const path = require("path");
const fs = require("fs");
const multer = require("multer");
const dayjs = require("dayjs"); // 用于日期处理
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Order = require("../../models/orderModel");
const Transaction = require("../../models/transactionModel");
require("dotenv").config(); // 确保环境变量被正确加载

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const mongoose = require("mongoose"); // 添加此行

let pendingSubscription;

exports.createSubscription = async (req, res) => {
  const { planType, email } = req.body;

  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userId = user.userId;

  // 检查是否存在未支付的 pending 订阅
  const existingPendingSubscription = await Subscribe.findOne({
    userId: userId,
    status: "pending",
  });

  if (existingPendingSubscription) {
    // 取消旧的 pending 订阅
    await cancelPendingSubscription(existingPendingSubscription);
  }

  // 开始一个会话
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 创建stripe customer
    const stripeCustomerId = await createOrRetrieveCustomer(email);
    console.log("-----------------------------");
    console.log("stripeCustomerId is: ", stripeCustomerId);
    const priceId = getPriceIdForPlan(planType);

    // 创建stripe订阅
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    const stripeSubscriptionId = stripeSubscription.id;
    console.log("stripeSubscriptionId is: ", stripeSubscriptionId);

    // 创建 Pending 状态的本地订阅
    pendingSubscription = await createPendingSubscription(
      stripeSubscriptionId,
      userId,
      planType,
      stripeCustomerId
    );
    console.log("Pending subscription created:", pendingSubscription._id);
    // 提交事务
    await session.commitTransaction();
    // 返回 client_secret 供前端确认支付
    res.json({
      clientSecret:
        stripeSubscription.latest_invoice.payment_intent.client_secret,
      stripeSubscription: stripeSubscription,
    });
  } catch (error) {
    // 回滚事务
    await session.abortTransaction();
    console.error("Error in createSubscription:", error);

    return res.status(400).json({ error: error.message });
  } finally {
    session.endSession(); // 结束会话
  }
};

async function cancelPendingSubscription(pendingSubscription) {
  try {
    const subscriptionId = pendingSubscription.subscriptionId;
    console.log(
      "pendingSubscription.stripeSubscriptionId is: ",
      pendingSubscription.stripeSubscriptionId
    );

    // const testStripeId = stripe.subscriptions.retrieve(pendingSubscription.stripeSubscriptionId);
    // console.log("testStripeId is: ", testStripeId);

    // 取消 Stripe 订阅
    await stripe.subscriptions.cancel(pendingSubscription.stripeSubscriptionId);
    console.log(
      `Cancelled Stripe subscription: ${pendingSubscription.stripeSubscriptionId}`
    );

    // 更新本地数据库中的状态
    await Subscribe.updateOne({ _id: subscriptionId }, { status: "cancelled" });
    console.log(
      `Updated local subscription status to cancelled: ${subscriptionId}`
    );
  } catch (error) {
    console.error("Error cancelling pending subscription:", error);
    throw new Error("Failed to cancel pending subscription");
  }
}

// async function rollbackSubscription(
//   stripeSubscriptionId,
//   pendingSubscriptionId
// ) {
//   try {
//     // 取消 Stripe 订阅
//     if (stripeSubscriptionId) {
//       await stripe.subscriptions.cancel(stripeSubscriptionId);
//       console.log(`Stripe subscription ${stripeSubscriptionId} cancelled.`);
//     }

//     // 删除本地的 Pending 订阅记录
//     if (pendingSubscriptionId) {
//       await Subscribe.deleteOne({ _id: pendingSubscriptionId });
//       console.log(
//         `Pending subscription ${pendingSubscriptionId} deleted from local database.`
//       );
//     }
//   } catch (error) {
//     console.error("Error during rollback:", error);
//     throw new Error("Rollback failed");
//   }
// }

exports.confirmPayment = async (req, res) => {
  const { stripeSubscription, paymentMethodId } = req.body;
  console.log("paymentMethodId is: ", paymentMethodId);
  console.log("stripeSubscriptionCustomer is: ", stripeSubscription.customer);

  // 开始一个会话
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 附加支付方法到订阅
    try{
      await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeSubscription.customer, // 假设 stripeSubscription 包含客户 ID
    });
    }catch(error){
      console.log("Error attaching payment method:", error);
    }
    


    // 设置为默认支付方法
    await stripe.customers.update(stripeSubscription.customer, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    console.log("stripeSubscription is: ", stripeSubscription);

    // 确认 Payment Intent
    const paymentIntent = stripeSubscription.latest_invoice.payment_intent; // 获取 Payment Intent
    if (paymentIntent) {
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
        paymentIntent.id
      );
      // 更新 Stripe 的订阅状态，这里没有变动的地方，就可以不更新
      // const updatedSubscription = await stripe.subscriptions.update(stripeSubscription.id, {
      //   // 在这里可以更新订阅的字段，例如：
      //   items: [{ id: stripeSubscription.id, price: newPriceId }],
      //   // 或者其他需要���新的字段
      // })
      // 创建交易表和订单表
      await confirmPaymentIntentAndCreateRecords(
        confirmedPaymentIntent,
        stripeSubscription.id
      );

      // 更新 paymentHistory, 更新本地数据库中的订阅状态
      await updatePaymentHistory(stripeSubscription.id, confirmedPaymentIntent);

      // 提交事务
      await session.commitTransaction();
      return res.json({ success: true, paymentIntent: confirmedPaymentIntent });
    }
    throw new Error("Payment confirmation failed");
  } catch (error) {
    // 回滚事务
    await session.abortTransaction();
    console.error("Payment confirmation error:", error);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession(); // 结束会话
  }
};

// 确认支付意图并创建订单和交易记录
async function confirmPaymentIntentAndCreateRecords(
  confirmedPaymentIntent,
  stripeSubscriptionId) {

  // const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
  //   paymentIntentId
  // );

  // 获取 subscription
  const subscription = await getSubscriptionByStripeSubscriptionId(stripeSubscriptionId);
  
  // 获取 planType
  const planType = subscription.planType;

  // 获取 userId
  const userId = subscription.userId;

  // 创建订单记录
  const order = new Order({
    userId: userId,
    subscriptionId: stripeSubscriptionId,
    amount: confirmedPaymentIntent.amount / 100, // 以美元为单位
    status: "completed",
    paymentMethod: "stripe",
    planType: planType,
  });
  await order.save();

  // 创建交易记录
  const transaction = new Transaction({
    userId: userId,
    orderId: order._id,
    amount: confirmedPaymentIntent.amount / 100,
    type: "payment",
    status: "completed",
    paymentMethod: "stripe",
    transactionId: confirmedPaymentIntent.id, // Stripe 的交易 ID
  });
  await transaction.save();

  return confirmedPaymentIntent;
}

async function updatePaymentHistory(
  stripeSubscriptionId,
  confirmedPaymentIntent
) {
  const subscription = await getSubscriptionByStripeSubscriptionId(
    stripeSubscriptionId
  );

  // 更新本地数据库中的订阅状态
  await Subscribe.updateOne(
    { stripeSubscriptionId: stripeSubscriptionId }, // 根据strip 订阅 ID 查找
    {
      $set: { status: "active", updatedAt: new Date() }, // 更新状态为 active
      $push: {
        paymentHistory: {
          // 添加支付记录
          method: "stripe",
          amount: confirmedPaymentIntent.amount / 100, // Stripe 返回的金额是以分为单位
          currency: confirmedPaymentIntent.currency,
          paymentDate: new Date(confirmedPaymentIntent.created * 1000), // 将 Unix 时间戳转换为 Date 对象
          status: "succeeded",
          transactionId: confirmedPaymentIntent.id,
          startDate: new Date(confirmedPaymentIntent.created * 1000), // 将 Unix 时间戳转换为 Date 对象
          endDate: calculateEndDate(subscription.planType),
          subscriptionId: subscription._id,
          invoiceId: confirmedPaymentIntent.invoice,
          // 其他字段...
        },
      },
    }
  );
}

// 根据 stripeSubscriptionId 查询 Subscription
async function getSubscriptionByStripeSubscriptionId(stripeSubscriptionId) {
  try {
    const subscription = await Subscribe.findOne({
      stripeSubscriptionId: stripeSubscriptionId,
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    return subscription; // 返回 planType 字段
  } catch (error) {
    console.error("Error fetching plan type:", error);
    throw new Error("Failed to fetch plan type");
  }
}

function getPriceIdForPlan(planType) {
  let priceId;

  switch (planType) {
    case "monthly":
      priceId = process.env.STRIPE_PRICE_MONTHLY;
      break;
    case "yearly":
      priceId = process.env.STRIPE_PRICE_YEARLY;
      break;
    // 可以添加更多计划类型
    default:
      console.log("Invalid plan type: ", planType);
      throw new Error(`Invalid plan type: ${planType}`);
  }

  if (!priceId) {
    throw new Error(`Price ID not configured for plan type: ${planType}`);
  }

  console.log(`Price ID for ${planType} plan:`, priceId);

  return priceId;
}

async function createOrRetrieveCustomer(email) {
  try {
    // 从 Chrome 存储中获取用户 ID
    if (!email) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // 检查是否已存在客户
    let customer = await stripe.customers.list({
      limit: 1,
      email: email,
    });

    if (customer.data.length === 0) {
      // 创建新客户
      customer = await stripe.customers.create({
        email: email,
        description: `User Email: ${email}`,
      });
    } else {
      customer = customer.data[0];
    }

    // res.json({ customerId: customer.id });
    return customer.id; // 直接返回客户 ID
  } catch (error) {
    console.error("Error in createOrRetrieveCustomer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function createPendingSubscription(
  stripeSubscriptionId,
  userId,
  planType,
  stripeCustomerId
) {
  console.log("createPendingSubscription....");
  console.log("planType is: ", planType);
  try {
    const pendingSubscription = new Subscribe({
      userId: userId,
      stripeCustomerId: stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId,
      status: "pending",
      planType: planType
    });
    await pendingSubscription.save();
    console.log("Pending subscription created:", pendingSubscription._id);
    return pendingSubscription;
  } catch (error) {
    console.error("Error creating pending subscription:", error);
    throw error;
  }
}

function calculateEndDate(planType) {
  const now = new Date(); // 获取当前日期
  let endDate;

  switch (planType) {
    case "monthly":
      endDate = new Date(now.setMonth(now.getMonth() + 1)); // 当前日期加一个月
      break;
    case "yearly":
      endDate = new Date(now.setFullYear(now.getFullYear() + 1)); // 当前日期加一年
      break;
    default:
      throw new Error("Invalid plan type"); // 处理无效的计划类型
  }

  return endDate; // 返回计算后的结束日期
}