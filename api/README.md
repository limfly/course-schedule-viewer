Serverless proxy 示例（本地测试说明）

依赖：
- node >= 16
- npm

安装（在仓库根或 `api` 目录中）:

```powershell
npm init -y
npm install node-fetch formidable
```

开发/测试：
- Vercel：安装 `vercel` CLI 并运行 `vercel dev` 来在本地调试 `api/*` 路径。
- 如果不使用 Vercel，本地可用一个轻量 Express 包装这些 handler：

示例：express-wrapper.js

```js
const express = require('express');
const parseExcel = require('./api/parse-excel');
const parseImage = require('./api/parse-image');
const app = express();
app.use(express.json({limit:'10mb'}));
app.post('/api/parse-excel', (req,res)=> parseExcel(req,res));
app.post('/api/parse-image', (req,res)=> parseImage(req,res));
app.listen(3000, ()=> console.log('listening 3000'));
```

然后：

```powershell
node express-wrapper.js
```

安全提示：永远不要在仓库中提交你的 API Key；在生产环境中使用平台的 Environment Variables（Vercel/Netlify/Cloudflare）功能。 
