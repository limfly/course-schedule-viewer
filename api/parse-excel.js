// 示例 Vercel serverless 函数：api/parse-excel.js
// 部署到 Vercel 后，该路径会变为 https://your-app.vercel.app/api/parse-excel

const XLSX = require('xlsx');
const fetch = require('node-fetch');

// 时间格式解析函数
function parseTimeString(timeStr) {
  if (!timeStr) return { weeks: [], weekday: '', periods: '' };
  
  const weeks = [];
  let weekday = '';
  let periods = '';
  
  // 解析周次
  const weekMatch = timeStr.match(/(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)\s*周/);
  if (weekMatch) {
    const weekParts = weekMatch[1].split(',');
    for (const part of weekParts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= 25) weeks.push(i);
        }
      } else {
        const week = Number(part);
        if (week >= 1 && week <= 25) weeks.push(week);
      }
    }
  }
  
  // 解析星期
  const dayMatch = timeStr.match(/星期([一二三四五六日天])/);
  if (dayMatch) {
    weekday = dayMatch[1];
    if (weekday === '天') weekday = '日';
  }
  
  // 解析节次
  const periodMatch = timeStr.match(/(\d+)(?:-(\d+))?\s*节/);
  if (periodMatch) {
    periods = periodMatch[0];
  }
  
  return {
    weeks: Array.from(new Set(weeks)).sort((a, b) => a - b),
    weekday,
    periods
  };
}

// 验证Excel数据格式
function validateExcelData(rows) {
  if (!Array.isArray(rows) || rows.length < 2) {
    return { valid: false, message: '文件内容为空或格式不正确' };
  }

  const headers = rows[0];
  const expectedHeaders = ['课程名称', '教学班号', '上课时间', '上课地点', '上课教师'];
  
  // 检查表头
  if (!expectedHeaders.every((header, index) => headers[index] === header)) {
    return { 
      valid: false, 
      message: `表头格式不正确，应为：${expectedHeaders.join('、')}` 
    };
  }

  // 检查数据行
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || !row[1]) {  // 课程名称和教学班号是必需的
      return {
        valid: false,
        message: `第${i + 1}行数据不完整：课程名称和教学班号为必填项`
      };
    }
  }

  return { valid: true };
}

/**
 * Configurable serverless proxy for parsing Excel rows via AI.
 * Environment variables:
 *  - AI_API_URL: (optional) full URL to AI provider endpoint. If not set, tries OpenAI-compatible endpoint.
 *  - AI_API_KEY: required
 *  - AI_API_KEY_HEADER: header name for API key (default: Authorization)
 *  - AI_MODEL: model name (default: gpt-5-mini)
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  try {
    // 从请求中获取文件
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) {
      return res.status(400).json({ success: false, message: '未找到上传的文件' });
    }

    // 读取Excel文件内容
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 转换为数组格式
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 验证数据格式
    const validation = validateExcelData(rows);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.message 
      });
    }

    // 处理数据行
    const courses = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue; // 跳过空行
      
      const name = row[0] || '';
      const classId = row[1] || '';
      const timeStr = row[2] || '';
      const location = row[3] || '';
      const teacher = row[4] || '';
      
      // 解析时间字符串
      const { weeks, weekday, periods } = parseTimeString(timeStr);
      
      courses.push({
        name,
        classId,
        time: timeStr,
        location,
        teacher,
        weeks,
        weekday,
        periods
      });
    }

    return res.json({ 
      success: true, 
      courses,
      message: `成功导入 ${courses.length} 门课程`
    });
    
  } catch (err) {
    console.error('Excel解析错误:', err);
    res.status(500).json({ 
      success: false, 
      message: '文件解析失败，请确保文件格式正确',
      detail: err.message 
    });
  }
};
