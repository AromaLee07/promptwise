const fs = require('fs');
const path = require('path');

/**
 * 读取指定目录下的 JSON 文件
 * @param {string} fileName - 文件名（包括扩展名）
 * @returns {Promise<Object>} - 返回解析后的 JSON 对象
 */
function loadData(fileName) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '../config', fileName); // 更新文件路径

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(`Error reading file: ${err.message}`);
      }
      try {
        const jsonData = JSON.parse(data); // 解析 JSON 数据
        resolve(jsonData);
      } catch (parseError) {
        reject(`Error parsing JSON: ${parseError.message}`);
      }
    });
  });
}

module.exports = loadData;