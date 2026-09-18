/* ================================================================
 * 文件：main.js（管家）
 * 作用：把 data.json 里的数据读出来，填进 index.html 页面的空容器里。
 * 阅读顺序建议：先看文件最后的 loadData()（入口），再看它调用的 renderProjects()
 * ================================================================ */

// API_BASE 是“数据从哪来”的地址。
// 现在指向本地文件 data.json；以后做前后端分离时，
// 只需要把它改成后端接口地址（如 http://localhost:3000/api），其他代码都不用动。
const API_BASE = 'data.json';

// loadData：加载数据。async = 这个函数里有“等待”操作（读文件要花时间）
async function loadData() {
  try {
    // ① fetch 是“去取”的意思：去取 data.json
    //   await = “等它取完再继续”（就像网购等快递，收到货才拆）
    const res = await fetch(API_BASE);

    // ② 取回来的是一大段 JSON 文字，res.json() 把它转成 JS 能用的“对象”
    const data = await res.json();

    // ③ 把数据交给渲染函数，让它把 4 个项目画到页面上
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
// projects 是数组（4 个项目），这个函数把它变成 4 张卡片的 HTML，填进空容器
function renderProjects(projects) {
  // 找到页面里 id 叫 projectsList 的空容器（在 index.html 的项目经历区）
  const box = document.getElementById('projectsList');

  // .map() = 对数组里的每一项都执行一遍括号里的函数，返回拼好的 4 张卡片
  // .join('') = 把 4 段 HTML 文字连成一整串
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

// 入口：页面一打开，就执行 loadData()，开始“取数据 → 填页面”的流程
loadData();
