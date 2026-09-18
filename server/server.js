/* ================================================================
 * 文件：server.js（后端服务器）
 * 作用：接收前端发来的"点击联系我"事件，把访客的 IP、时间、来源等信息
 *       保存到同目录的 visits.json 文件里，方便你随时查看。
 *
 * 怎么运行（三步，在 VS Code 里操作）：
 *   第 1 步：打开终端，输入 cd server 回车（进入 server 文件夹）
 *   第 2 步：输入 npm install 回车（安装依赖，只需要装一次）
 *   第 3 步：输入 node server.js 回车（启动服务器）
 *   看到 "后端已启动：http://localhost:3000" 就说明成功了。
 *
 * 运行期间：
 *   打开 http://localhost:3000       → 在浏览器里查看点击记录（表格）
 *   打开 http://localhost:3000/api/visits → 查看原始 JSON 数据
 *
 * 注意：visits.json 里存的是访客 IP，属于隐私信息，
 *       已被 .gitignore 排除，不会提交到 GitHub 公开仓库。
 * ================================================================ */

// ---- 引入三个"工具箱"（Node 提供的能力） ----
const express = require('express'); // Express：搭建接口/服务器最常用的框架
const cors = require('cors');       // cors：允许网页跨域名访问本服务器
const fs = require('fs');           // fs：读写文件的工具（Node 自带）
const path = require('path');       // path：拼接文件路径的工具（Node 自带）

const app = express();              // 创建服务器对象
const PORT = 3000;                  // 端口号：服务器在电脑上的"门牌号"
const DATA_FILE = path.join(__dirname, 'visits.json'); // 记录保存的文件（和本文件同目录）

// 让服务器能处理跨域请求、看懂前端发来的 JSON 数据
app.use(cors());
app.use(express.json());

// ---- 读取现有记录（文件不存在时返回空数组） ----
function readRecords() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

// ---- 记录一次"点击联系我"（前端弹窗打开时，会自动调用这个接口） ----
app.post('/api/visit', function (req, res) {
  // 1. 从请求里取出访客信息
  //    IP：优先取 x-forwarded-for（以后部署到云服务器时靠它拿真实 IP），取不到就用 req.ip
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
  const time = new Date().toLocaleString('zh-CN', { hour12: false }); // 当前时间（中国格式）
  const ua = req.headers['user-agent'] || '';   // 浏览器/设备信息
  const source = req.body.source || 'unknown';  // 从页面哪个按钮点的（顶部按钮 / 底部按钮）

  // 2. 读出旧记录，把新记录放到最前面（最新在最上）
  const records = readRecords();
  records.unshift({ ip: ip, time: time, source: source, ua: ua });

  // 3. 存回文件（缩进 2 空格，方便人看）
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');

  // 4. 告诉前端"保存成功"
  res.json({ ok: true, message: '已记录' });
});

// ---- 查看记录（JSON 格式，浏览器直接访问就能看到） ----
app.get('/api/visits', function (req, res) {
  res.json(readRecords());
});

// ---- 打开 http://localhost:3000 时，显示一个带样式的记录查看页 ----
app.get('/', function (req, res) {
  const records = readRecords();

  // 统计信息：总次数、今天次数
  const today = new Date().toLocaleDateString('zh-CN');
  const todayCount = records.filter(function (r) { return r.time.indexOf(today) >= 0; }).length;

  // 把每条记录拼成表格的一行
  const rows = records.map(function (r, i) {
    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + (r.ip || '') + '</td>' +
      '<td>' + (r.time || '') + '</td>' +
      '<td>' + (r.source || '') + '</td>' +
      '<td style="max-width:320px;word-break:break-all;">' + (r.ua || '') + '</td>' +
    '</tr>';
  }).join('');

  // 页面骨架（一张表格 + 统计数字）
  res.send('<!DOCTYPE html>' +
    '<html lang="zh-CN"><head><meta charset="UTF-8">' +
    '<title>联系我点击记录</title>' +
    '<style>' +
      'body{font-family:system-ui,"Microsoft YaHei",sans-serif;background:#f8fafc;margin:0;padding:40px 24px;color:#1a202c}' +
      '.wrap{max-width:980px;margin:0 auto}' +
      'h1{font-size:22px}' +
      '.stats{display:flex;gap:16px;margin:18px 0 24px}' +
      '.stat{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 22px;text-align:center}' +
      '.stat b{display:block;font-size:24px;color:#2563eb}' +
      '.stat span{font-size:12px;color:#718096}' +
      'table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)}' +
      'th,td{border-bottom:1px solid #e2e8f0;padding:10px 12px;font-size:13px;text-align:left}' +
      'th{background:#f1f5f9;font-weight:600}' +
      'a{color:#2563eb}' +
    '</style></head><body><div class="wrap">' +
    '<h1>📋 联系我点击记录</h1>' +
    '<div class="stats">' +
      '<div class="stat"><b>' + records.length + '</b><span>累计点击</span></div>' +
      '<div class="stat"><b>' + todayCount + '</b><span>今天点击</span></div>' +
    '</div>' +
    '<table><thead><tr><th>#</th><th>IP 地址</th><th>时间</th><th>点击来源</th><th>浏览器 / 设备</th></tr></thead>' +
    '<tbody>' + (rows || '<tr><td colspan="5" style="color:#94a3b8">还没有记录，去页面点一下"联系我"试试</td></tr>') + '</tbody>' +
    '</table>' +
    '<p style="color:#94a3b8;font-size:12px;margin-top:16px">提示：这个页面只有你自己能看（后端在你电脑上跑着）。<a href="/api/visits">查看 JSON 原始数据</a></p>' +
    '</div></body></html>');
});

// ---- 启动服务器（让电脑开始"听" 3000 端口） ----
app.listen(PORT, function () {
  console.log('后端已启动：http://localhost:3000');
});
