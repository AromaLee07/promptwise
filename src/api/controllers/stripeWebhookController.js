require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../../models/userModel'); // 假设您有一个用户模型
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;




async function handleSubscriptionCreated(subscription) {
  // 更新用户的订阅状态
  await User.findOneAndUpdate(
    { stripeCustomerId: subscription.customer },
    { 
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      subscriptionPlan: subscription.items.data[0].price.id
    }
  );
}

async function handleSubscriptionUpdated(subscription) {
  // 类似于 created，但可能需要处理计划变更等
}

async function handleSubscriptionDeleted(subscription) {
  // 更新用户状态为未订阅
  await User.findOneAndUpdate(
    { stripeCustomerId: subscription.customer },
    { 
      subscriptionStatus: 'canceled',
      subscriptionId: null,
      subscriptionPlan: null
    }
  );
}

async function handleInvoicePaid(invoice) {
  // 可能需要更新付款记录，发送收据等
}


function generateMockSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadToSign = `${timestamp}.${payload}`;
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: payloadToSign,
    secret: secret,
  });
  return `t=${timestamp},${signature}`;
}





exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  console.log('Received Stripe webhook');
  console.log('Stripe-Signature:', sig);
  console.log('STRIPE_WEBHOOK_SECRET:', webhookSecret);
  let event;
 


  try {
    // 验证 webhook 签名
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    console.error('Stripe-Signature:', sig);
    console.error('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Webhook verified successfully');
  console.log('Event type:', event.type);

  // 处理事件
  switch (event.type) {
    case 'customer.subscription.created':
      console.log('Customer subscription created');
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.finalized':
      await handleInvoiceFinalized(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePaid(event.data.object);
      break;
    // 添加其他事件类型的处理逻辑
    default:
      console.log(`Unhandled event type ${event.type}`);
    // 添加其他您需要处理的事件类型
  }

  // 返回 200 响应表示成功接收
  res.json({received: true});
};


async function handleInvoiceFinalized(invoice) {
  console.log('Handling finalized invoice:', invoice.id);
  // 这里可以添加处理逻辑，例如：
  // - 更新数据库中的订单状态
  // - 发送通知给客户
  // - 准备发票发送流程
}
