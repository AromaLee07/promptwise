// src/app.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./api/routes/userRoutes");
const apiRoutes = require("./api/routes/apiRoutes");
const subscribeRoutes = require("./api/routes/subscribeRoutes");
const stripeWebhookRoutes = require("./api/routes/stripeWebhookRoutes");
const getDataRoutes = require("./api/routes/getDataRoutes");
const path = require("path");
const mongoUri = process.env.MONGO_URI;
const https = require('https');
const fs = require('fs');
const app = express();

const cors = require("cors"); // 引入 cors 中间件
// const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');


// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 读取 SSL 证书和私钥
// const options = {
//   key: fs.readFileSync('/home/ec2-user/cetification/private.key'), // 替换为你的私钥路径
//   cert: fs.readFileSync('/home/ec2-user/cetification/certificate.pem'), // 替换为你的证书路径
// };

// 创建 HTTPS 服务器
// const server = https.createServer(options, app);


// Mongoose connection
mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// CORS 配置
const corsOptions = {
  // origin: function (origin, callback) {
  //   // 允许的域名列表
  //   const allowedOrigins = [
  //     "http://localhost:3000",
  //     "https://localhost:3000",
  //     "chrome-extension://efhojinannanlccmmgmlkbclabplgikn",
  //     "http://172.111.10.216", // 添加 VPN 的 IP 地址
  //     'https://52.15.239.126:3000', // 允许 AWS 服务器的地址
  //   ];
  //   if (!origin || allowedOrigins.indexOf(origin) !== -1) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error("Not allowed by CORS"));
  //   }
  // },
  origin: '*',
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// 中间件和路由配置

// 重要：Webhook 路由应该在 body parser 之前，因为它需要原始请求体
app.use("/stripe", stripeWebhookRoutes);

// CORS 配置
app.use(cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 中间件
// app.use(bodyParser.json()); // 解析 JSON 请求体
// app.use(cookieParser()); // 解析 cookies


// 其他路由
// app.use(apiRoutes);
app.use("/subscribe", subscribeRoutes);
app.use("/user", userRoutes);
app.use("/get", getDataRoutes);
app.use("/api", apiRoutes);

// 静态文件服务
app.use(express.static(path.join(__dirname, "..", "public")));

const port = 3000;
app.listen(port,'0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});


module.exports = app;
