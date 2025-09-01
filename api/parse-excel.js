// 示例 Vercel serverless 函数：api/parse-excel.js
// 部署到 Vercel 后，该路径会变为 https://your-app.vercel.app/api/parse-excel

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const { rows, fileName } = req.body || {};
    if (!rows || !Array.isArray(rows)) return res.status(400).json({ success: false, message: '无 rows' });

    // 构建 prompt（few-shot 示例），注意保持返回纯 JSON
    const prompt = `
你是结构化数据助手。输入为若干行表格数据，列顺序：课程名称,教学班号,上课时间,上课地点,上课教师。请返回纯 JSON 数组，字段：name,classId,time,location,teacher,weeks,weekday,periods，weeks 为整数数组，weekday 为单字中文（如 一 二 三...），periods 如 "6-7节" 或空字符串。若一行包含多个上课时间，请返回多个对象。

示例输入:
形势与政策3,000553-071,12-15周星期五8-9节,D1147,陈瀚谕
毛泽东思想和中国特色社会主义理论体系概论,992336-029,1-4,6-17周星期一6-7节,D1243,黄炎
毛泽东思想和中国特色社会主义理论体系概论实践,000550-029,10周,,黄炎

现在解析以下行(共${rows.length}行)：\n${rows.slice(0,200).map(r=>r.join(',')).join('\n')}

返回纯 JSON。`;

    const API_KEY = process.env.AI_API_KEY;
    if (!API_KEY) return res.status(500).json({ success: false, message: '服务器未配置 AI_API_KEY' });

    const body = {
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: '你是结构化数据助手' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000
    };

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      return res.status(502).json({ success: false, message: 'AI 服务错误', detail: txt });
    }

    const aiJson = await aiResp.json();
    const text = aiJson.choices?.[0]?.message?.content || aiJson.choices?.[0]?.text || '';

    // 提取 JSON 文本并解析
    const jsonStart = text.indexOf('[');
    const jsonText = jsonStart >= 0 ? text.slice(jsonStart) : text;
    let parsed = [];
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      return res.status(502).json({ success: false, message: 'AI 返回的文本无法解析为 JSON', raw: text });
    }

    return res.json({ success: true, courses: parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
