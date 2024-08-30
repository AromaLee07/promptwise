// src/app.js
require('dotenv').config();


const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./api/routes/userRoutes');
const apiRoutes = require('./api/routes/apiRoutes');
const subscribeRoutes = require('./api/routes/subscribeRoutes')
const stripeWebhookRoutes = require('./api/routes/stripeWebhookRoutes')
const getDataRoutes = require('./api/routes/getDataRoutes')
const path = require('path');
const app = express();
const mongoUri = process.env.MONGO_URI;

const cors = require('cors'); // 引入 cors 中间件


// Mongoose connection
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));


// CORS 配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = ['http://localhost:3000', 'chrome-extension://efhojinannanlccmmgmlkbclabplgikn'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};



// 中间件和路由配置

// 重要：Webhook 路由应该在 body parser 之前，因为它需要原始请求体
app.use('/stripe', stripeWebhookRoutes);

// CORS 配置
app.use(cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// 其他路由
app.use(apiRoutes);
app.use('/subscribe', subscribeRoutes)
app.use('/user', userRoutes);
app.use('/get', getDataRoutes)
app.use('/api', apiRoutes)

// 静态文件服务
app.use(express.static(path.join(__dirname, '..', 'public')));


const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


module.exports = app;
