// 示例 Vercel serverless 函数：api/parse-excel.js
// 部署到 Vercel 后，该路径会变为 https://your-app.vercel.app/api/parse-excel

const fetch = require('node-fetch');

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
    const { rows, fileName } = req.body || {};
    if (!rows || !Array.isArray(rows)) return res.status(400).json({ success: false, message: '无 rows' });

    const API_KEY = process.env.AI_API_KEY;
    if (!API_KEY) return res.status(500).json({ success: false, message: '服务器未配置 AI_API_KEY' });

    const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
    const AI_API_KEY_HEADER = process.env.AI_API_KEY_HEADER || 'Authorization';
    const AI_MODEL = process.env.AI_MODEL || 'gpt-5-mini';

    // Build prompt with few-shot examples
    const exampleLines = [
      '形势与政策3,000553-071,12-15周星期五8-9节,D1147,陈瀚谕',
      '毛泽东思想和中国特色社会主义理论体系概论,992336-029,1-4,6-17周星期一6-7节,D1243,黄炎',
      '毛泽东思想和中国特色社会主义理论体系概论实践,000550-029,10周,,黄炎'
    ];

    const rowsText = rows.slice(0, 200).map(r => r.join(',')).join('\n');

  const prompt = `你是结构化数据助手。输入为若干行表格数据，列顺序：课程名称,教学班号,上课时间,上课地点,上课教师。你必须返回纯 JSON 数组，数组中每个对象必须包含以下字段：\n- name: 课程名称 (字符串)\n- classId: 教学班号 (字符串)\n- time: 原始上课时间字符串 (字符串)\n- location: 上课地点 (字符串)\n- teacher: 上课教师 (字符串)\n- weeks: 周次数组 (整数数组，升序，去重；有效范围 1-25；若无法识别请返回空数组 [])\n- weekday: 单字中文星期（'一'-'日'）或空字符串\n- periods: 节次字符串，如 '6-7节' 或空字符串\n\n如果一行包含多个不同的上课时间（例如同一课程在不同星期或不同周），请为每个时间段返回一个独立对象，其他字段重复。不要输出任何多余的说明文字，只返回纯 JSON。\n\n示例输入与期望输出：\n输入行：\n${exampleLines.join('\n')}\n期望输出（示例）：\n[\n  {"name":"形势与政策3","classId":"000553-071","time":"12-15周星期五8-9节","location":"D1147","teacher":"陈瀚谕","weeks":[12,13,14,15],"weekday":"五","periods":"8-9节"},\n  {"name":"毛泽东思想和中国特色社会主义理论体系概论","classId":"992336-029","time":"1-4,6-17周星期一6-7节","location":"D1243","teacher":"黄炎","weeks":[1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17],"weekday":"一","periods":"6-7节"},\n  {"name":"毛泽东思想和中国特色社会主义理论体系概论实践","classId":"000550-029","time":"10周","location":"","teacher":"黄炎","weeks":[10],"weekday":"","periods":""}\n]\n\n现在解析以下行（共 ${rows.length} 行）：\n${rowsText}\n返回纯 JSON 数组。`;

    // Build request body for model. We support both OpenAI-compatible chat completions and generic HTTP POST endpoints
    const body = {
      model: AI_MODEL,
      messages: [
        { role: 'system', content: '你是结构化数据助手，确保输出为纯 JSON 数组。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000
    };

    const headers = {
      'Content-Type': 'application/json'
    };
    // Support different header styles
    if (AI_API_KEY_HEADER.toLowerCase() === 'authorization') {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    } else {
      headers[AI_API_KEY_HEADER] = API_KEY;
    }

    const aiResp = await fetch(AI_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      return res.status(502).json({ success: false, message: 'AI 服务错误', detail: txt });
    }

    const aiJson = await aiResp.json();
    // Try to extract assistant text (compatible with OpenAI chat response or other providers)
    const text = (aiJson.choices && aiJson.choices[0] && (aiJson.choices[0].message?.content || aiJson.choices[0].text)) || aiJson.result || aiJson.output || '';

    // Extract JSON array from text
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start < 0 || end < 0) {
      return res.status(502).json({ success: false, message: 'AI 未返回 JSON 数组', raw: text });
    }
    const jsonText = text.slice(start, end + 1);

    let parsed = [];
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      return res.status(502).json({ success: false, message: 'AI 返回的文本无法解析为 JSON', raw: text });
    }

    // Basic validation: ensure each item has required fields and normalize
    const MAX_WEEK = 25;
    const weekdayMap = {
      '一':'一','二':'二','三':'三','四':'四','五':'五','六':'六','日':'日','天':'日'
    };

    const normalized = [];
    for (const item of parsed) {
      const name = item.name || item.course || item.courseName || '';
      const classId = item.classId || item.class || '';
      const timeField = item.time || item.originalTime || '';
      const location = item.location || item.room || '';
      const teacher = item.teacher || '';

      let weeks = [];
      if (Array.isArray(item.weeks)) {
        weeks = item.weeks.map(n=>Number(n)).filter(n=>Number.isInteger(n) && n>=1 && n<=MAX_WEEK);
      }

      // 如果 weeks 为空，尝试从 timeField 提取简单的周次范围（例如 '10周' 或 '1-4周'）
      if (weeks.length === 0 && typeof timeField === 'string') {
        const m = timeField.match(/(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)\s*周/);
        if (m) {
          const parts = m[1].split(',');
          for (const p of parts) {
            if (p.includes('-')) {
              const [s,e] = p.split('-').map(x=>Number(x));
              if (Number.isInteger(s) && Number.isInteger(e)) {
                for (let k=s;k<=e;k++) if (k>=1 && k<=MAX_WEEK) weeks.push(k);
              }
            } else {
              const w = Number(p);
              if (Number.isInteger(w) && w>=1 && w<=MAX_WEEK) weeks.push(w);
            }
          }
        }
      }

      // dedupe and sort weeks
      weeks = Array.from(new Set(weeks)).sort((a,b)=>a-b);

      let weekday = item.weekday || item.day || '';
      if (typeof weekday === 'string') {
        weekday = weekday.trim().replace('星期','');
        weekday = weekdayMap[weekday] || (weekday.length===1?weekday:'');
      } else {
        weekday = '';
      }

      const periods = item.periods || '';

      normalized.push({ name, classId, time: timeField, location, teacher, weeks, weekday, periods });
    }

    return res.json({ success: true, courses: normalized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
