部署后端安全代理（示例，Vercel/Cloudflare Worker）

目的
- 不在浏览器中暴露 AI API Key。前端将 Excel 表格数据发送到该代理，代理在安全环境变量中保存 API_KEY，调用 AI 服务并把解析好的 JSON 返回给前端。

建议：使用 Vercel、Netlify 或 Cloudflare Worker 部署一个小型 serverless 函数。

示例（Node.js Express 风格，适用于 Vercel Serverless 或 Netlify Functions）

1) 文件：api/parse-excel.js（Vercel）
```js
// api/parse-excel.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const { rows, fileName } = req.body;
    if (!rows || !Array.isArray(rows)) return res.status(400).json({ success: false, message: '无 rows' });

    // 构建 prompt（示例）
    const examples = `示例行:\n形势与政策3,000553-071,12-15周星期五8-9节,D1147,陈瀚谕\n`;

    const textPayload = examples + '\n' + rows.slice(0,200).map(r => r.join(',')).join('\n');

    // 调用 AI：以 OpenAI 为例（替换为你使用的服务）
    const AI_API_URL = 'https://api.openai.com/v1/chat/completions';
    const API_KEY = process.env.AI_API_KEY; // 在 Vercel/Netlify 上设置环境变量

    const prompt = `...` // 使用前述详细 prompt 模板

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [{ role: 'system', content: '你是结构化数据助手' }, { role: 'user', content: prompt }],
        max_tokens: 3000
      })
    });

    const result = await response.json();
    // 解析 result，取出纯 JSON 文本，并 JSON.parse

    // 下面是假设的返回格式
    return res.json({ success: true, courses: parsedCourses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
```

2) 部署步骤（Vercel）
- 在 Vercel 控制台新建项目，连接你的 GitHub 仓库。
- 在项目设置 -> Environment Variables 中添加 `AI_API_KEY`，值设置为你的 key（例如：450ac398... 但请务必使用你自己的并保密）。
 - 在项目设置 -> Environment Variables 中添加 `AI_API_KEY`，值设置为你的 key（请务必保密）。
 - 如果使用 BigModel（国内型号），请设置：
   - `AI_API_URL` = `https://open.bigmodel.cn/api/paas/v4/chat/completions`
   - `AI_API_KEY_HEADER` = `Authorization`（通常为默认）
   - `AI_MODEL` = `gpt-3.5-mini` 或你选择的可用模型
- 推送并部署，Vercel 会自动部署 `api/*` 下的 serverless 函数。

示例：在本地使用 PowerShell 设置临时环境变量并运行（仅用于本地测试，部署时请在 Vercel/Netlify 控制台中设置）：

```powershell
$env:AI_API_KEY = '你的_key_这里'
$env:AI_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
# 然后本地启动一个静态服务器或用 vercel dev 运行本地测试
vercel dev
```

3) 前端配置
- 在 `app.js` 中设置 `AI_PROXY_URL` 为你的 Vercel 部署域名（例如 `https://your-app.vercel.app`）。
- 导入流程中会自动调用 `POST ${AI_PROXY_URL}/api/parse-excel`。

安全与成本注意
- 限制代理访问频率，避免滥用（可以在代理中实现简单的速率限制或基于认证的访问）。
- 代理在调用 AI 时会产生成本（按 token 计费），建议对上传行数或并发做限制，并缓存已解析的结果。

如果需要，我可以为你：
- 生成完整的 Vercel 函数实现（含 prompt 模板与解析代码），或
- 生成 Cloudflare Worker 版本（更便宜，延迟低），或
- 把前端 `app.js` 修改为直接调用代理并显示更详细的解析预览（我已经在本地增加了调用点）。

请选择你希望我继续：生成 Vercel 函数代码、Cloudflare Worker 代码，还是进一步完善前端集成（例如在导入对话中显示代理开关与进度）？
