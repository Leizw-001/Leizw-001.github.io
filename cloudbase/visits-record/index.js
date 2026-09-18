'use strict';

/* ================================================================
 * 文件：index.js（腾讯云 CloudBase 云函数，中文名可以叫"记录访客点击"）
 * 作用：前端点击"联系我"时调用它，把访客 IP、时间、来源存进云数据库。
 *
 * 部署位置：腾讯云 CloudBase 控制台 → 云函数 → 新建（运行环境选 Node.js 16.13）
 * 部署后在"HTTP 访问服务"里开启，得到 https 地址，把 main.js 里的
 * REPORT_API 改成：https://你的环境id.service.tcloudbase.com/visits-record
 *
 * 查看记录：CloudBase 控制台 → 数据库 → visits 集合 → 文档列表
 * ================================================================ */

// 引入 CloudBase 官方 SDK（在云函数 package.json 里添加依赖 @cloudbase/node-sdk）
const cloud = require('@cloudbase/node-sdk');

// 初始化：SYMBOL_CURRENT_ENV 表示"就在当前这个环境里运行"
const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
const db = app.database(); // 数据库操作对象

// 统一的返回头：允许任何网页跨域调用 + 返回 JSON
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',                 // 允许所有网站调用（简历站是公开的）
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

// 主函数：云函数的入口（event 里装着请求信息，context 里是运行环境信息）
exports.main = async function (event, context) {
  const headers = event.headers || {}; // 请求头

  // 第一步：处理浏览器的"预检请求"（浏览器发正式请求前会先发一个 OPTIONS 试探）
  //        如果不处理，跨域会被浏览器拦截
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  // 第二步：只接受 POST（其他方法直接拒绝）
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: false, message: '只支持 POST 请求' })
    };
  }

  try {
    // 第三步：提取访客信息
    // IP：HTTP 访问服务会把真实 IP 放在请求头里，多试几个常见位置
    const ip = (
      event.clientIP ||
      headers['x-real-ip'] ||
      headers['x-client-ip'] ||
      headers['x-forwarded-for'] ||
      ''
    ).toString().split(',')[0].trim();

    // 时间（中国格式）
    const time = new Date().toLocaleString('zh-CN', { hour12: false });

    // 浏览器 / 设备信息
    const ua = headers['user-agent'] || '';

    // 前端发来的内容（从哪个按钮点的），body 可能是字符串，也可能是对象
    let body = {};
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {});
    } catch (e) {
      body = {};
    }
    const source = body.source || 'unknown';

    // 第四步：存进云数据库的 visits 集合（一条文档 = 一次点击）
    await db.collection('visits').add({
      data: {
        ip: ip,
        time: time,
        source: source,
        ua: ua,
        createdAt: db.serverDate() // 服务器时间，方便以后排序
      }
    });

    // 第五步：告诉前端保存成功
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: true, message: '已记录' })
    };
  } catch (err) {
    // 出错时返回 500，并把错误打印到云函数日志里
    console.error('保存记录失败：', err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ ok: false, message: '服务器内部错误' })
    };
  }
};
