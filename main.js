/* ================================================================
 * 文件：main.js（管家）
 * 作用：
 *   1. 把 data.json 里的项目数据读出来，填进页面（数据与页面分离）
 *   2. 管理"联系我"弹窗：点击后显示手机号/邮箱，并向后端上报访客信息
 * 阅读顺序建议：先看文件最后的 loadData()，再看 renderProjects()，
 * 最后看"联系我"弹窗相关的三个函数。
 * ================================================================ */

// ---------- 第 1 部分：项目数据 ----------

// API_BASE 是"项目数据从哪来"的地址。
// 现在指向本地文件 data.json（GitHub Pages 直接托管）；
// 以后如果想把项目数据也改成后端接口，把这里换成后端地址即可。
const API_BASE = 'data.json';

// loadData：加载数据。async = 这个函数里有"等待"操作（读文件要花时间）
async function loadData() {
  try {
    // ① fetch 是"去取"的意思：去取 data.json
    //   await = "等它取完再继续"（就像网购等快递，收到货才拆）
    const res = await fetch(API_BASE);

    // ② 取回来的是一大段 JSON 文字，res.json() 把它转成 JS 能用的"对象"
    const data = await res.json();

    // ③ 把数据交给渲染函数，让它把项目画到页面上
    renderProjects(data.projects);
  } catch (err) {
    // ④ 万一出错（最常见的：没用 Live Server 打开，浏览器禁止网页读本地文件）
    //    就在页面显示提示文字，而不是白屏
    console.error('加载失败：', err);
    document.getElementById('projectsList').innerHTML =
      '<p style="color:#e53e3e">内容加载失败，请稍后刷新</p>';
  }
}

// renderProjects：渲染项目卡片。
// projects 是数组（多个项目），这个函数把它变成一张张卡片的 HTML，填进空容器
function renderProjects(projects) {
  // 找到页面里 id 叫 projectsList 的空容器（在 index.html 的项目经历区）
  const box = document.getElementById('projectsList');

  // .map() = 对数组里的每一项都执行一遍括号里的函数，返回拼好的所有卡片
  // .join('') = 把多段 HTML 文字连成一整串
  box.innerHTML = projects.map(function (p) {
    return (
      '<div class="project-card">' +
        '<div class="project-icon">' + p.icon + '</div>' +
        '<div class="project-title">' + esc(p.title) + '</div>' +
        '<p class="project-desc">' + esc(p.desc) + '</p>' +
        '<div class="project-tags">' +
          p.tags.map(function (t) { return '<span class="project-tag">' + esc(t) + '</span>'; }).join('') +
        '</div>' +
      '</div>'
    );
  }).join('');
  // 上面的 p.icon / p.title / p.desc / p.tags，就是 data.json 里每个项目的字段
}

// esc：转义函数（安全措施）。
// 把数据里的特殊字符（如 < > & " '）转成安全写法，防止它们破坏页面结构，
// 也防止别人在数据里写恶意代码。数据来自自己写的 data.json 时风险低，但好习惯先养成。
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// ---------- 第 2 部分：联系我弹窗 ----------

// 手机号和邮箱只写在这里（JS 文件里），页面 HTML 中没有，
// 所以爬虫抓不到、访客也看不到明文，只有点击"联系我"弹窗后才会展示。
const PHONE = '15222292837';
const EMAIL = 'Lzw15222292837@163.com';

// REPORT_API 是"记录点击"的后端接口地址。
// 本地测试：http://localhost:3000（先运行 server 文件夹里的 node server.js）
// 以后部署到服务器后，把这里换成你部署好的公网地址即可。
const REPORT_API = 'http://localhost:3000/api/visit';

// openContactModal：打开弹窗（点击"联系我"按钮时触发）
// source = 从哪个按钮点的，比如"顶部按钮"或"底部按钮"，方便你以后看统计
function openContactModal(source) {
  // 把手机号和邮箱填进弹窗里的对应位置
  document.getElementById('modalPhone').textContent = PHONE;
  document.getElementById('modalEmail').textContent = EMAIL;
  // 给弹窗加上 show 类，CSS 里 .show 才显示
  document.getElementById('contactModal').classList.add('show');
  // 同时向后端上报"有人点了联系我"（后端没开也不影响弹窗，所以 catch 里什么都不做）
  reportContactClick(source || 'unknown');
}

// closeContactModal：关闭弹窗（点×或点弹窗外背景时触发）
function closeContactModal() {
  document.getElementById('contactModal').classList.remove('show');
}

// reportContactClick：把点击事件发给后端保存
function reportContactClick(source) {
  fetch(REPORT_API, {
    method: 'POST', // POST = 提交数据
    headers: { 'Content-Type': 'application/json' }, // 告诉后端：我发的是 JSON
    body: JSON.stringify({ source: source }) // 要保存的内容（从哪个按钮点的）
  }).catch(function () {
    // 后端没启动时静默失败，不影响弹窗正常显示
  });
}

// copyText：点击"复制"按钮，把对应手机号/邮箱复制到剪贴板
function copyText(btn) {
  // 找到按钮所在的那一行（modal-item），取出里面的联系方式文字
  var item = btn.closest('.modal-item');
  var text = item.querySelector('.modal-value').textContent;

  // 复制成功后的提示（把按钮文字临时变成"已复制"）
  function showDone() {
    btn.textContent = '已复制';
    setTimeout(function () { btn.textContent = '复制'; }, 1500);
  }

  // 复制有两种方式：
  // 方式一：navigator.clipboard（新版浏览器推荐，但只在 https 或 localhost 下可用）
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(showDone).catch(function () { fallbackCopy(); });
  } else {
    fallbackCopy();
  }

  // 方式二：老办法（创建一个临时输入框选中复制），兼容所有浏览器
  function fallbackCopy() {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showDone();
  }
}

// 点弹窗外面的灰色背景 = 关闭弹窗（事件委托：判断点击的是不是遮罩层本身）
document.addEventListener('click', function (e) {
  if (e.target && e.target.id === 'contactModal') {
    closeContactModal();
  }
});

// ---------- 入口：页面一打开就开始干活 ----------
loadData();
