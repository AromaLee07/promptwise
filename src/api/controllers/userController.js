// src/api/controllers/userController.js
const User = require("../../models/userModel");
const Click = require("../../models/clickModel"); // 稍后创建

const path = require("path");
const fs = require("fs");
const multer = require("multer");
const dayjs = require("dayjs"); // 用于日期处理
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 打印请求体
    console.log("Request Body:", req.body);
    // 检查是否已经存在相同的用户名或电子邮件
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log("User already exists with this username.");
      return res.status(400).json({
        success: false,
        message: "Username already exists, please choose another one.",
      });
    }

    // 继续查找邮箱，确保邮箱唯一
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      console.log("User already exists with this email.");
      return res.status(400).json({
        success: false,
        message: "Email already exists, please use another email.",
      });
    }

    const newUser = new User({
      username: req.body.username,
      passwordHash: req.body.password, // 在实际应用中，密码应当被加密
      email: req.body.email,
      avatarUrl: "/images/default-avatar.jpg", // 设置默认头像 URL
    });

    await newUser.save();
    console.log("New User Registered:", newUser);

    // res.send('User registered successfully');

    // return res.status(200).json({
    //     userId: newUser._id.toHexString(), // 返回 userId
    //     username: newUser.username,
    //     email: newUser.email,
    //     avatarUrl: newUser.avatarUrl
    //   });

    return res.status(200).json({
      success: true,
      userData: {
        // 包装 userData 对象
        userId: newUser._id.toHexString(),
        username: newUser.username,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl,
        clickCount: newUser.dailyClicks.count,
      },
    });
  } catch (error) {
    console.error("Error during registration:", error.message, error.stack);

    res.status(500).send(error);
  }
};

exports.findUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    console.log("Received email parameter:", email); // 添加调试信息

    const user = await User.findOne({ email: email });
    if (user) {
      console.log("User found:", user); // 添加调试信息

      res.json(user);
    } else {
      console.log("User not found"); // 添加调试信息

      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error during user lookup:", error); // 添加调试信息

    res.status(500).send(error.message);
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.params.userId;
    const avatar = req.file;
    if (!avatar) {
      return res.status(400).send("No file uploaded.");
    }

    // 确保目录存在
    const uploadDir = path.join(__dirname, "../../../public/uploads/avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const originalName = avatar.originalname;
    const fileName = `${userId}-${Date.now()}${path.extname(originalName)}`;
    const filePath = path.join(uploadDir, fileName);

    // 保存文件
    fs.rename(avatar.path, filePath, async (err) => {
      if (err) {
        console.error("Error renaming file:", err);
        return res.status(500).send("Error saving file.");
      }

      const avatarUrl = `/uploads/avatars/${fileName}`;

      try {
        // 更新数据库
        const user = await User.findByIdAndUpdate(
          userId,
          { avatarUrl },
          { new: true }
        );

        if (!user) {
          return res.status(404).send("User not found");
        }

        res.status(200).json({ avatarUrl });
      } catch (dbError) {
        console.error("Error updating user:", dbError);
        res.status(500).send("Error updating user.");
      }
    });
  } catch (error) {
    console.error("Error during avatar upload:", error);
    res.status(500).send(error.message);
  }
};

exports.login = async (req, res) => {
  console.log("req is: ", req.body);
  const { email, password } = req.body;
  try {
    // const user = await User.findUserByEmail(email);
    console.log("try and try");
    const existingUser = await User.findOne({ email: email });
    console.log("from bk:", existingUser);

    if (!existingUser) {
      console.log(
        "we cannot find this existing user, please register firstly."
      );
      // return res.status(404).send("User not found, please register!");
      return res
        .status(404)
        .json({ message: "User not found, please register!" });
    } else {
      console.log("user founded is :", email);
    }
    const isMatch = await bcrypt.compare(password, existingUser.passwordHash);
    if (!isMatch) {
      // return res.status(401).send("Invalid credentials");
      return res.status(401).json({ message: "Invalid credentials!" });
    } else {
      console.log("password founded is :", password);
    }
    // 创建 JWT
    // 生成 JWT 密钥
    const jwtSecret = generateJWTSecret();
    //  生成 JWT token
    const token = jwt.sign(
      { id: existingUser._id, email: existingUser.email },
      jwtSecret,
      { expiresIn: "1d" } // Token 有效期为1天
    );

    console.log("token is: ", token);
    // res.cookie('jwt', token, { httpOnly: true });
    // res.send("Login successful");
    // 用户验证逻辑...
    // 尝试设置 Cookie
    try {
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: true,
        maxAge: 86400000,
      });
    } catch (cookieError) {
      console.error("Error setting cookie:", cookieError);
      // 这里可以选择继续处理，或者返回一个错误响应
      // return res.status(500).send("Failed to set cookie");
    }

    return res.status(200).json({
      success: true,
      token: token,
      userData: {
        userId: existingUser._id.toHexString(),
        username: existingUser.username,
        email: existingUser.email,
        avatarUrl: existingUser.avatarUrl,
        clickCount: existingUser.dailyClicks.count,
      },
      // token: token // 将JWT附加到响应中
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.logout = async (req, res) => {
  try {
    // 清除 JWT cookie
    res.clearCookie('jwt', { httpOnly: true, secure: true });

    // 返回成功响应
    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout',
    });
  }
};



exports.click = async (req, res) => {
  try {
    // const { userId } = req.body;
    const userId = req.params.userId;

    const today = dayjs().startOf("day").toDate();

    // 检查是否为 PROD 用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const isProdUser = user.isProdUser;
    let maxClicks = isProdUser ? Infinity : 10; // PROD 用户不限点击次数

    // 检查今日点击次数
    const clickRecord = await Click.findOne({
      userId,
      createdAt: { $gte: today },
    });

    if (clickRecord) {
      if (clickRecord.clickCount >= maxClicks) {
        return res.status(403).send("Daily click limit reached");
      }
      clickRecord.clickCount++;
    } else {
      const newClick = new Click({ userId, clickCount: 1 });
      await newClick.save();
      user.dailyClicks.date = today;
      user.dailyClicks.count = 1;
      await user.save();
    }

    await clickRecord.save();

    // 计算剩余点击次数
    const remainingClicks = maxClicks - clickRecord.clickCount;

    // 发送响应，包括剩余点击次数
    res.status(200).json({
      message: "Click recorded",
      remainingClicks: remainingClicks,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

function generateJWTSecret() {
  return crypto.randomBytes(32).toString("hex");
}
