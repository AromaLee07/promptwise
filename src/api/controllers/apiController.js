const openai = require("openai");
const User = require("../../models/userModel");

const MOONSHOT_API_KEY = "sk-5SItFFYpHhECFAnKhZoovfvC7oEB89miktU2rru6hq0Je8Mt";
const temperature = 0.3;
let sysytemContent = "";
let systemContent = "";
const axios = require("axios");
const qs = require("qs");




const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/auth/google/callback";
const OPENAI_API_KEY = "sk-t8vvnuGyQ2jdB590IrfgkmBEMY9MSC8lZauRYOUlxTvyDqL8";

exports.googleTest = async (req, res) => {
  res.send("Callback reached");
  console.log("xixihahahahah");
};

exports.googleLogin = async (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=openid email profile&state=someRandomState`;
  //   res.redirect(authUrl);
  // const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
  //   REDIRECT_URI
  // )}&scope=openid email profile&access_type=offline`;
  console.log(authUrl);
  res.redirect(authUrl);
};

exports.googleCallback = async (req, res) => {
  console.log("后端开始了callback");
  // 处理授权回调
  const authCode = req.query.code;

  if (!authCode) {
    // 如果没有授权码，重定向用户到 Google 的 OAuth 2.0 授权页面
    return res.status(400).send("Authorization code not found");
  } else {
    try {
      // 使用授权码请求访问令牌
      const tokenResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        qs.stringify({
          code: authCode,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token } = tokenResponse.data;

      // 使用访问令牌请求用户信息
      const userInfoResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const userData = userInfoResponse.data;

      // 查询数据库中是否存在该用户
      let user = await User.findOne({ googleId: userData.sub });

      if (!user) {
        // 如果用户不存在，创建新用户
        try {
          user = new User({
            googleId: userData.sub,
            email: userData.email,
            username: userData.name,
            // 添加其他需要的字段
          });
          await user.save();
        } catch (dbError) {
          console.error("Error saving new user to the database:", dbError);
          return res.status(500).send("Failed to create user in the database");
        }
      } else {
        // 更新用户的 updatedAt 字段为当前时间
        try {
          user.updatedAt = Date.now();
          await user.save();
        } catch (dbError) {
          console.error("Error updating user in the database:", dbError);
          return res.status(500).send("Failed to update user in the database");
        }
      }

      // 生成 JWT token
      // const token = jwt.sign(
      //   {
      //     id: user._id,
      //     email: user.email,
      //     googleId: user.googleId,
      //   },
      //   process.env.JWT_SECRET,
      //   { expiresIn: "1d" } // Token 有效期为1天
      // );

      // 将用户重定向到前端页面，并附带用户信息
      res.redirect(
        `chrome-extension://efhojinannanlccmmgmlkbclabplgikn/login.html?user=${encodeURIComponent(
          JSON.stringify(userData)
        )}`
      );

      // 将用户重定向到前端页面，并附带 token
      // res.redirect(
      //   `chrome-extension://efhojinannanlccmmgmlkbclabplgikn/login.html?token=${encodeURIComponent(token)}`
      // );

      console.log("userData is: ", userData);
      // res.json(userData);
    } catch (error) {
      console.error("Error during Google login:", error);
      res.status(500).send("Authentication failed");
    }
  }
};

// exports.googleCallback = async (req, res) => {};

exports.generate = async (req, res) => {};

exports.generate_kimi = async (req, res) => {
  console.log("req.body.category is: ", req.body.category);
  const { category, content } = req.body;
  console.log("category is: ", category);
  console.log("content is: ", content);
  if (category == "lyricsGens") {
    sysytemContent =
      "假设你是一个专业的音乐制作人, 对于如下给出的关键字，为用户生成专业的歌词, 歌词的结构如下：'[Instrumetal intro]\n强劲的乐器前奏\n[Verse 1]\n第一段歌词，建立主题\n[Chorus]\n副歌部分，充满能量\n[Verse 2]\n第二段歌词，增加冲突或发展故事\n[Chorus]\n重复副歌\n[Solo]\n乐器独奏部分，通常是吉他\n[Bridge]\n过渡部分，带来新的元素\n[Chorus]\n再次重复副歌\n[Outro]\n结束部分，可能是乐器的渐弱'。请确保生成的歌词或曲风中不包含当前给定的关键词，而是根据关键词的意境进行展开。";
  } else if (category == "songGens") {
    // sysytemContent =
    //   "假设你是一个专业的音乐制作人, 对于如下给出的关键字, 模仿罗大佑的曲风，为用户生成提示词以确保能产出专业、高质量的歌曲，返回的提示词字数限制在200字以内";
    sysytemContent =
    "假设你是一个专业的音乐制作人, 对于如下给出的关键字，为用户生成极具创意的提示词以确保能产出专业、高质量的歌曲，返回的提示词是以讲故事的方式，字数不能超过100字。请确保生成的歌词或曲风中不包含当前给定的关键词，而是根据关键词的意境进行展开。";
  
  } else {
    sysytemContent =
      "你是 Kimi, 由 Moonshot AI 提供的人工智能助手, 你更擅长中文和英文的对话. 你会为用户提供安全, 有帮助, 准确的回答. 同时, 你会拒绝一切涉及恐怖主义, 种族歧视, 黄色暴力等问题的回答. Moonshot AI 为专有名词，不可翻译成其他语言.";
  }

  console.log(sysytemContent);

  const messages = [
    {
      role: "system",
      content: sysytemContent,
    },
    { role: "user", content: content },
    // 添加一条消息以清除上下文
    { role: "system", content: "清除上下文" }, 
  ];

  try {
    // 从请求中获取数据，使用 req.body 而不是 req.json
    console.log(
      "content from req is :",
      req.body.content,
      typeof req.body.content == Object
    );

    // Create OpenAI client
    const client = new openai.OpenAI({
      apiKey: MOONSHOT_API_KEY,
      baseURL: "https://api.moonshot.cn/v1",
    });

    const model = "moonshot-v1-8k";

    // Call OpenAI's API
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature,
    });

    console.log(completion.choices[0].message.content);
    return res.status(200).json({
      answer: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.generate = async (req, res) => {
  const { category, content } = req.body;
  const { theme, mimic, keys } = content;
  const structure = "[Verse 1]\n第一段歌词，建立主题\n[Chorus]\n副歌部分，充满能量\n[Verse 2]\n第二段歌词，增加冲突或发展故事\n[Chorus]\n重复副歌\n[Solo]\n乐器独奏部分，通常是吉他\n[Bridge]\n过渡部分，带来新的元素\n[Chorus]\n再次重复副歌\n";

  console.log("category is: ", category);
  console.log("content is: ", content);
  if (category == "lyricsGens") {
    systemContent = `假设你是一位专业的音乐制作人，创作的主题是关于‘${theme}’。请模仿${mimic}的风格，创作出一首动人的歌曲。歌词按照以下结构给出：${structure}。请确保歌词富有诗意，能够引起听众的共鸣。要求给过来的答案只包括歌词，不要其他内容。`
  } else if (category == "songGens") {
    // sysytemContent =
    //   "假设你是一个专业的音乐制作人, 对于如下给出的关键字, 模仿罗大佑的曲风，为用户生成提示词以确保能产出专业、高质量的歌曲，返回的提示词字数限制在200字以内";
    systemContent =
    "假设你是一个专业的音乐制作人, 对于如下给出的关键字，为用户生成极具创意的提示词以确保能产出专业、高质量的歌曲，返回的提示词是以讲故事的方式，字数不能超过100字。请确保生成的歌词或曲风中不包含当前给定的关键词，而是根据关键词的意境进行展开。";
  
  } else {
    systemContent =
      "你是 GTP, 你更擅长中文和英文的对话. 你会为用户提供安全, 有帮助, 准确的回答. 同时, 你会拒绝一切涉及恐怖主义, 种族歧视, 黄色暴力等问题的回答. Moonshot AI 为专有名词，不可翻译成其他语言.";
  }

  // const systemContent =
  // "假设你是一个专业的音乐制作人, 对于如下给出的关键字，为用户生成专业的歌词, 歌词的结构如下：'[Instrumetal intro]\n强劲的乐器前奏\n[Verse 1]\n第一段歌词，建立主题\n[Chorus]\n副歌部分，充满能量\n[Verse 2]\n第二段歌词，增加冲突或发展故事\n[Chorus]\n重复副歌\n[Solo]\n乐器独奏部分，通常是吉他\n[Bridge]\n过渡部分，带来新的元素\n[Chorus]\n再次重复副歌\n[Outro]\n结束部分，可能是乐器的渐弱'。请确保生成的歌词或曲风中不包含当前给定的关键词，而是根据关键词的意境进行展开。";
  // const systemContent =    "假设你是一个专业的音乐制作人, 对于如下给出的关键字, 模仿中国宋词的风格，为用户生成专业的歌词, 歌词的结构如下：'[Verse 1]\n第一段歌词，建立主题\n[Chorus]\n副歌部分，充满能量\n[Verse 2]\n第二段歌词，增加冲突或发展故事\n[Chorus]\n重复副歌\n[Solo]\n乐器独奏部分，通常是吉他\n[Bridge]\n过渡部分，带来新的元素\n[Chorus]\n再次重复副歌'。请确保生成的歌词或曲风中不包含当前给定的关键词，而是根据关键词的意境进行展开。";

  try {
    const response = await axios.post(
      "https://api.302.ai/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: keys,
          },
          // 添加一条消息以清除上下文
          { role: "system", content: "清除上下文" },
        ],
        // max_tokens: req.body.max_tokens || 100, // optional
        // temperature: req.body.temperature || 0.7 // optional
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`, // 确保使用正确的 API 密钥
          "Content-Type": "application/json", // 确保内容类型正确
          'Accept': "application/json", // 确保接受的内容类型正确
          // 其他可能需要的头部
        },
      }
    );
    // console.log(response);

    const result = response.data;

    let content11 = "";

    // 检查 choices 是否存在并且有元素
    if (result.choices && result.choices.length > 0) {
      content11 = result.choices[0].message.content;
      console.log("Content:", content11); // 输出: Content: Hi there! How can I assist you today?
    } else {
      console.error("No choices available in the result.");
    }

    // res.json(content11);
    return res.status(200).json({
      answer: content11
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Error contacting OpenAI API" });
  }
};


