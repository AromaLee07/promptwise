const express = require("express");
const router = express.Router();
const getDataController = require("../controllers/getDataController");
const planController = require("../controllers/planController");

// 获取本地订阅
router.get("/subscription", (req, res) => {
  const email = req.query.email; // 获取 email 参数
  getDataController.getActiveSubscriptions(req, res, email); // 将 email 传递给控制器
});

//通过PlayTime获取PlanOption
router.get("/planOption", (req, res) => {
  const { planType } = req.query; // 从查询参数获取 planType
  planController.getPlanOptionByPlanType(req, res, planType); // 将 planType 传递给控制器
});

//获取所有PlanOption
router.get("/planOptions", (req, res) => {
  planController.getPlanOptions(req, res);
});
// router.get('/images', (req, res) => {
//     const { icon } = req.query; // 从查询参数获取 icon
//     planController.getPlanIcons(req, res, icon); // 将 icon 传递给控制器
// });

// 获取用户所有订单
router.get("/orders", (req, res) => {
    const email = req.query.email; // 获取 email 参数
    getDataController.getUserOrders(req, res, email); // 将 email 传递给控制器
  });

module.exports = router;
