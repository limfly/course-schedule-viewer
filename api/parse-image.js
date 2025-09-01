// 示例 Vercel/Netlify serverless 函数：api/parse-image.js
// 功能：接收图片文件（multipart/form-data），将图片作为 base64 或 multipart 转发到后端大模型/或 OCR 服务，
// 并返回与 parse-excel 相同的规范化 JSON 数组结构 { success, courses: [...] }

const fetch = require('node-fetch');
const formidable = require('formidable');
const fs = require('fs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // 使用 formidable 解析 multipart（Vercel/Netlify 环境下可能需要另行处理）
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ success: false, message: '解析上传失败' });

    const file = files.file || files.image;
    if (!file) return res.status(400).json({ success: false, message: '未找到上传的图片文件，字段名应为 file 或 image' });

    try {
      // 读取文件并转为 base64（注意内存开销，生产环境请流式处理或直接转发 multipart）
      const buffer = fs.readFileSync(file.path);
      const base64 = buffer.toString('base64');

      const API_KEY = process.env.AI_API_KEY;
      if (!API_KEY) return res.status(500).json({ success: false, message: '服务器未配置 AI_API_KEY' });

      const AI_API_URL = process.env.AI_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
      const AI_API_KEY_HEADER = process.env.AI_API_KEY_HEADER || 'Authorization';
      const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-mini';

      // 构造 prompt：告诉模型先做 OCR（如果模型支持直接解析图片）或接收 base64 并返回结构化 JSON
      const userContent = `下面是一张课表的图片（已编码为 base64），请先识别图片中的表格文本（OCR），
并按照列顺序(课程名称,教学班号,上课时间,上课地点,上课教师)提取每一行，最后返回纯 JSON 数组。每个对象必须包含字段: name,classId,time,location,teacher,weeks,weekday,periods。不要加入说明文字。图片大小(base64 长度): ${base64.length}`;

      const body = {
        model: AI_MODEL,
        messages: [
          { role: 'system', content: '你是一个OCR与结构化数据助手，必须输出纯 JSON 数组。' },
          { role: 'user', content: userContent },
          // 如果大模型接口支持直接上传二进制或url，可在此提供content包含 base64 或一个标记，具体取决于模型能力
        ],
        // 将 base64 附在一个额外字段，某些后端可以从 payload 中读取并处理（取决于服务能力）
        image_base64: base64,
        max_tokens: 3000
      };

      const headers = { 'Content-Type': 'application/json' };
      if (AI_API_KEY_HEADER.toLowerCase() === 'authorization') headers['Authorization'] = `Bearer ${API_KEY}`;
      else headers[AI_API_KEY_HEADER] = API_KEY;

      const aiResp = await fetch(AI_API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!aiResp.ok) {
        const txt = await aiResp.text();
        return res.status(502).json({ success: false, message: 'AI 服务错误', detail: txt });
      }

      const aiJson = await aiResp.json();
      const text = (aiJson.choices && aiJson.choices[0] && (aiJson.choices[0].message?.content || aiJson.choices[0].text)) || aiJson.result || aiJson.output || '';

      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start < 0 || end < 0) return res.status(502).json({ success: false, message: 'AI 未返回 JSON 数组', raw: text });

      const jsonText = text.slice(start, end + 1);
      let parsed = [];
      try { parsed = JSON.parse(jsonText); } catch (err) { return res.status(502).json({ success: false, message: 'AI 返回的文本无法解析为 JSON', raw: text }); }

      // 规范化（同 parse-excel 中的逻辑）
      const MAX_WEEK = 25;
      const weekdayMap = { '一':'一','二':'二','三':'三','四':'四','五':'五','六':'六','日':'日','天':'日' };
      const normalized = [];
      for(const item of parsed){
        const name = item.name || item.course || item.courseName || '';
        const classId = item.classId || item.class || '';
        const timeField = item.time || item.originalTime || '';
        const location = item.location || item.room || '';
        const teacher = item.teacher || '';
        let weeks = [];
        if(Array.isArray(item.weeks)) weeks = item.weeks.map(n=>Number(n)).filter(n=>Number.isInteger(n)&&n>=1&&n<=MAX_WEEK);
        // try extract weeks from time if empty
        if(weeks.length===0 && typeof timeField==='string'){
          const m = timeField.match(/(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)\s*周/);
          if(m){ const parts = m[1].split(','); for(const p of parts){ if(p.includes('-')){ const [s,e]=p.split('-').map(x=>Number(x)); for(let k=s;k<=e;k++) if(k>=1&&k<=MAX_WEEK) weeks.push(k);} else { const w=Number(p); if(Number.isInteger(w)&&w>=1&&w<=MAX_WEEK) weeks.push(w);} } }
        }
        weeks = Array.from(new Set(weeks)).sort((a,b)=>a-b);
        let weekday = item.weekday || item.day || '';
        if(typeof weekday === 'string'){ weekday = weekday.trim().replace('星期',''); weekday = weekdayMap[weekday] || (weekday.length===1?weekday:''); } else weekday = '';
        const periods = item.periods || '';
        normalized.push({ name, classId, time: timeField, location, teacher, weeks, weekday, periods });
      }

      return res.json({ success: true, courses: normalized });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });
};
