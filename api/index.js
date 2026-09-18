/* ================================================================
 * 文件：api/index.js（Vercel 版后端接口）
 * 作用：和 server/server.js 功能一样，记录"点击联系我"的访客，
 *      但按 Vercel 平台的要求改成了"函数"形式（不能自己监听端口）。
 *
 * 路由：
 *   POST /api/visit   ← 前端点击"联系我"时调用（保存一条记录）
 *   GET  /api/visits  ← 查看所有记录（返回 JSON）
 *
 * 本地测试：在项目根目录执行  node api/index.js
 *          然后访问 http://localhost:3001/api/visits
 * ================================================================ */

// 引入工具箱
const express = require('express'); // Express 框架
const cors = require('cors');       // 允许网页跨域名访问
const kv = require('./kv');         // 数据存储层（见 kv.js）

const app = express();

// 中间件：放开跨域 + 解析 JSON 请求体
app.use(cors());
app.use(express.json());

// ---- 记录一次"点击联系我" ----
app.post('/api/visit', async function (req, res) {
  try {
    // 1. 取访客信息（IP 优先取代理头，取不到就用直连 IP）
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
    const time = new Date().toLocaleString('zh-CN', { hour12: false });
    const ua = req.headers['user-agent'] || '';
    const source = req.body.source || 'unknown';

    // 2. 交给存储层保存
    await kv.pushRecord({ ip: ip, time: time, source: source, ua: ua });

    // 3. 返回成功
    res.json({ ok: true, message: '已记录' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: '服务器内部错误' });
  }
});

// ---- 查看所有记录（JSON） ----
app.get('/api/visits', async function (req, res) {
  try {
    res.json(await kv.getRecords());
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: '服务器内部错误' });
  }
});

// 本地测试专用：直接 node api/index.js 时，在 3001 端口启动
// （在 Vercel 上运行时不会执行这里，Vercel 用自己的方式调用上面的 app）
if (require.main === module) {
  app.listen(3001, function () {
    console.log('本地测试模式：http://localhost:3001');
  });
}

// 导出 app，交给 Vercel 运行
module.exports = app;
