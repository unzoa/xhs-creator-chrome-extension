let finnal = []

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(request)
  if (request.action === 'refreshDOM') {
    // 选择页面中指定的 DOM 元素
    const targetElement = document.querySelectorAll('.note-card-container');
    // 确保元素存在
    if (targetElement) {

      let ret = []

      targetElement.forEach(item => {
        const {
          title,
          publish_time,

          watch,
          view_long,
          like,
          collect,

          comments,
          danmu,
          share,
          fans
        } = {
          title: item.querySelector('.info-text').querySelector('.title').innerText,
          publish_time: item.querySelector('.info-text').querySelector('.publish-time').innerText,

          ...item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li').length === 4
            ? {
              watch: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[0].querySelector('b').innerText,
              view_long: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[1].querySelector('b').innerText,
              like: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[2].querySelector('b').innerText,
              collect: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[3].querySelector('b').innerText,
            }
            : {
              watch: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[0].querySelector('b').innerText,
              view_long: 0,
              like: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[1].querySelector('b').innerText,
              collect: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[2].querySelector('b').innerText,
            },

          ...item.querySelector('.info-list').querySelectorAll('.data-list').length === 4
            ? {
              comments: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[0].querySelector('b').innerText,
              danmu: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[1].querySelector('b').innerText,
              share: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[2].querySelector('b').innerText,
              fans: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[3].querySelector('b').innerText,
            }
            : {
              comments: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[0].querySelector('b').innerText,
              danmu: 0,
              share: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[1].querySelector('b').innerText,
              fans: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[2].querySelector('b').innerText,
            },
        }

        console.log(title, publish_time, watch, view_long, like, collect, comments, danmu, share, fans)

        ret.push([title, publish_time, watch, view_long, like, collect, comments, danmu, share, fans])
      })

      const csvData = generateCSV(ret)

      // 创建 Blob 对象
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // 下载文件
      // 创建下载链接
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.csv';
      document.body.appendChild(a); // 将链接添加到 DOM 中
      a.click(); // 触发点击事件下载文件
      document.body.removeChild(a); // 下载完成后从 DOM 中移除链接
      URL.revokeObjectURL(url); // 释放 Blob URL


      // 发送数据到后台脚本
      // chrome.runtime.sendMessage({ type: 'pageData', data: ret });
    } else {
      console.log('Element not found');
    }
  }
});

function generateCSV(data) {
  // 将数据格式化为 CSV 字符串
  const csvRows = [];
  // 添加标题行（如果需要）
  csvRows.push('标题,发布时间,观看量,人均观看时长,点赞量,收藏量,评论量,弹幕数,分享量,直接涨粉数'); // 根据数据列调整标题

  // 添加数据行
  data.forEach(row => {
    csvRows.push(row.join(',')); // 将数据行数组连接为 CSV 行
  });

  return csvRows.join('\n'); // 连接所有行
}
