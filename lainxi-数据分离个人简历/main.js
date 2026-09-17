async function loadData() {
  try {
    // ① 去读 data.json 文件；await = "等它读完再继续"
    const res = await fetch('data.json');
    // ② 把文件内容转成 JS 能用的对象
    const data = await res.json();

    // ③ 把数据填进页面：找到 id 叫 name 的元素，把文字换掉
    document.getElementById('name').textContent = data.name;
    document.getElementById('job').textContent = data.job;

    // ④ 工作经历不止一条，用循环把每条都变成 <li> 塞进列表
    const list = document.getElementById('expList');
    list.innerHTML = data.experience.map(function (item) {
      return '<li>' + item.time + ' · ' + item.company + ' · ' + item.role + '</li>';
    }).join('');

  } catch (err) {
    // ⑤ 万一出错（比如没用 Live Server 打开），给提示而不是白屏
    console.error('加载失败：', err);
    document.getElementById('name').textContent = '加载失败：请用 Live Server 打开';
  }
}
loadData(); // 页面一打开就执行
