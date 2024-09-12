const Subscribe = require("../../models/subscribeModel");
const User = require('../../models/userModel'); // 引入 User 模型
const Order = require('../../models/orderModel'); // 引入 User 模型




exports.getUserOrders = async (req, res) => {
    console.log('getUserOrders....')
    const { email } = req.query;
    console.log('email', email)

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    try {
        // 根据 email 查询用户
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const userId = user._id; // 获取 userId
        console.log('userId', userId)

        // 查询用户的所有订单
        const orders = await Order.find({ userId }); // 使用 populate 获取关联的订阅信息

        console.log('orders', orders)

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "No orders found for this user." });
        }

        return res.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return res.status(500).json({ success: false, error: error.message });
    }

}



exports.getActiveSubscriptions = async (req, res) => {
    console.log('getActiveSubscriptions')
    const { email } = req.query; // 从查询参数获取 email

    console.log('email', email)

    if (!email) {
        return res.status(400).json({ error: "Email is required" }); // 错误处理
    }

    try {

        // 根据 email 获取 userId
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" }); // 用户未找到
        }

        const userId = user._id; // 获取 userId

        const activeSubscriptions = await Subscribe.find({
            userId: userId,                     // 根据 email 过滤
            status: 'active'       // 订阅状态不是 canceled
        });

        console.log('activeSubscriptions', activeSubscriptions)

        // 检查 activeSubscriptions 是否为空
        if (activeSubscriptions.length === 0) {
            return res.json({ success: true, message: "No active subscriptions found.", subscriptions: [] });

        }

        // 提取 paymentHistory 中的最新记录
        const result = activeSubscriptions.map(subscription => {
            const latestPayment = subscription.paymentHistory[subscription.paymentHistory.length - 1]; // 获取最新的支付记录
            return {
                planType: subscription.planType,
                startDate: latestPayment.startDate,
                endDate: latestPayment.endDate
            };
        });

        console.log('result', result)

        return res.json({ activeSubscriptions: result });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" }); // 处理其他错误
    }
}

exports.getSubscription = async (req, res) => {
    const { email } = req.query; // 从查询参数获取 email
    if (!email) {
        return res.status(400).json({ error: "Email is required" }); // 错误处理
    }

    try {
        const subscription = await getSubscriptionByEmail(email);
        return res.json({ subscription });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" }); // 处理其他错误
    }
}


getSubscriptionByEmail = async (email) => {
    const subscription = await Subscribe.findOne({email})
    return subscription;
}

