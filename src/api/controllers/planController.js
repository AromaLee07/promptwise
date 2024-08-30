const loadData = require('../../utils/loadData');
const path = require('path'); // 引入 path 模块
const Order = require('../../models/orderModel');


exports.getPlanOptionByPlanType = async (req, res) => {
  const { planType } = req.query; // 从查询参数获取 planType

  console.log('planType', planType)

  try {
    const subscriptionOptions = await loadData('planOptions.json'); // 读取文件
    console.log("subscriptionOptions is: ", subscriptionOptions);

    // 根据 planType 过滤选项
    const filteredOptions = subscriptionOptions.filter(option => option.type === planType);

    console.log('filteredOptions', filteredOptions)

    if (filteredOptions.length === 0) {
      return res.status(404).json({ success: false, message: "No options found for the specified planType." });
    }

    console.log('filteredOptions', filteredOptions)

    res.json({ success: true, options: filteredOptions[0] });
  } catch (error) {
    console.error('Error loading subscription options:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.getPlanOptions = async (req, res) => {
  console.log('getPlanOptions....')
  
    try {
      const subscriptionOptions = await loadData('planOptions.json'); // 读取文件
      console.log("subscriptionOptions is: ", subscriptionOptions);
  
  
      console.log('subscriptionOptions', subscriptionOptions)
  
  
      res.json({ success: true, options: subscriptionOptions });
    } catch (error) {
      console.error('Error loading subscription options:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };



