/* ================================================================
 * 文件：api/kv.js（数据存储层，给 api/index.js 用）
 * 作用：统一"读记录 / 写记录"两个动作。
 *      自动选择存储方式：
 *        - 配置了 Upstash 环境变量 → 存到 Upstash Redis（线上用）
 *        - 没配置 → 存到本地 api/visits.json（本地测试用）
 * ================================================================ */

// Node 自带的文件读写工具
const fs = require('fs');
const path = require('path');

// 从环境变量里读取 Upstash 的地址和密钥（在 Vercel 控制台里配置）
// 没配置时是空字符串，代码会自动改用本地文件
const UPSTASH_URL = process.env.UPSTASH_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REST_TOKEN || '';

// 本地测试时记录存在这个文件里（已被 .gitignore 排除，不会上传）
const LOCAL_FILE = path.join(__dirname, 'visits.json');

// 读取本地文件里的记录（文件不存在或坏了就返回空数组）
function readLocal() {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

// 把记录写进本地文件
function writeLocal(list) {
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

// 从 Upstash 读取记录（用 Upstash 的 REST 接口）
async function readUpstash() {
  const res = await fetch(UPSTASH_URL + '/get/visits', {
    headers: { Authorization: 'Bearer ' + UPSTASH_TOKEN }
  });
  const data = await res.json();
  // 结果是一个 JSON 字符串（或 null），需要解析成数组
  return data.result ? JSON.parse(data.result) : [];
}

// 把记录写进 Upstash（整个数组存到一个 key 里，够用了）
async function writeUpstash(list) {
  await fetch(UPSTASH_URL + '/set/visits/' + encodeURIComponent(JSON.stringify(list)), {
    headers: { Authorization: 'Bearer ' + UPSTASH_TOKEN }
  });
}

// 对外提供的两个函数：读取全部记录 / 在最前面插入一条记录
async function getRecords() {
  if (UPSTASH_URL) return readUpstash();
  return readLocal();
}

async function pushRecord(record) {
  if (UPSTASH_URL) {
    const list = await readUpstash();
    list.unshift(record);
    await writeUpstash(list);
  } else {
    const list = readLocal();
    list.unshift(record);
    writeLocal(list);
  }
}

// 把两个函数导出，供 api/index.js 使用（不写这句的话外面就找不到）
module.exports = { getRecords: getRecords, pushRecord: pushRecord };
