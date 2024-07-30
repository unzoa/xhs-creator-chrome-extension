// 线索
// 当页面在笔记页时候，才开始定时计算

let finnal = [
  ['标题', '发布时间','观看量','人均观看时长','点赞量','收藏量','评论量','弹幕数','分享量','直接涨粉数']
]
let page = 1
let page_count = 1
let can_next = false
let handle = false


// 提取按钮，多页数据，不直接生成报告，而是点击按钮后再自动化生成
const start_btn_style = 'position: fixed; z-index: 9999; left: 10px; bottom: 10px; width: 100px; height: 40px; background-color: #4CAF50; color: white; cursor: pointer; border: none; font-size: 16px; border-radius: 4px; box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2),  0 6px 20px 0 rgba(0,0,0,0.19); '
const start = document.createElement('button')
start.innerText = "提取数据"
start.style = 'display: none;'
start.onclick = () => {
  handle = true
  start.style = 'display: none;'

  // 当只有1页时候，点击按钮才生成报告
  if (page_count === 1) {
    export_xlsx(finnal)
  }
}
document.body.appendChild(start);

if (location.pathname === '/creator/notes') {
  start.style = start_btn_style
}

function reset () {
  finnal = [
    ['标题', '发布时间','观看量','人均观看时长','点赞量','收藏量','评论量','弹幕数','分享量','直接涨粉数']
  ]
  page = 1
  can_next = false
  handle = false
  start.style = start_btn_style
}
// “提取数据”按钮显示判断
window.addEventListener('popstate', function(event) {
  if (location.pathname === '/creator/notes') {
    // 重置状态
    reset()
  } else {
    start.style = 'display: none;'
  }
});



// 触发下一页操作
function next_page () {
  const next_page_dom = Array.from(document.querySelector('.page-actions').querySelectorAll('button')).reverse()[0]
  if (next_page_dom) {
    next_page_dom.click()
  } else {
    console.log('没有下一页')
  }
}

// 由于netx_page在chrome.runtime中能触发按钮变化，但是不能触发api请求，所以用定时器中判断条件触发
setInterval(() => {
  // console.log('can_next =', can_next, ' handle =', handle)
  if (can_next && handle) {
    next_page()
    page += 1
    can_next = false
  }
}, 1000)


// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // 获取页数
  page_count = document.querySelector('.page-settings').innerText.split('，')[1].replace(' 页', '') * 1

  if (request.action === 'refreshDOM') {
    // 选择页面中指定的 DOM 元素
    const targetElement = document.querySelectorAll('.note-card-container');
    // 确保元素存在
    if (targetElement) {
      let ret = []
      targetElement.forEach(item => {
        const { title, publish_time, watch, view_long, like, collect, comments, danmu, share, fans } = get_data_from_dom(item)
        ret.push([title, publish_time, watch, view_long, like, collect, comments, danmu, share, fans])
      })
      // console.log('ret', ret.length)
      // console.log('page:', page, page_count)

      // 当页面只有1页时候，只生成一次，不再刷新页面
      if (page_count === 1) {
        finnal = finnal.concat(ret)
      }

      // 当页面数量大于1页
      else {
        if (page === page_count) {
          finnal = finnal.concat(ret)
          export_xlsx(finnal)

          location.reload();
        } else {
          finnal = finnal.concat(ret)
          setTimeout(() => {
            can_next = true
          }, 1000)
        }
      }
    } else {
      console.log('Element not found');
    }
  }
});

function get_data_from_dom (item) {
  return {
    title: item.querySelector('.info-text').querySelector('.title').innerText,
    publish_time: item.querySelector('.info-text').querySelector('.publish-time').innerText,

    ...item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li').length === 4
      ? {
        watch: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[0].querySelector('b').innerText,
        view_long: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[1].querySelector('b').innerText,
        like: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[2].querySelector('b').innerText,
        collect: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[3]?.querySelector('b').innerText,
      }
      : {
        watch: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[0].querySelector('b').innerText,
        view_long: 0,
        like: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[1].querySelector('b').innerText,
        collect: item.querySelector('.info-list').querySelectorAll('.data-list')[0].querySelectorAll('li')[2]?.querySelector('b').innerText,
      },

    ...item.querySelector('.info-list').querySelectorAll('.data-list').length === 4
      ? {
        comments: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[0].querySelector('b').innerText,
        danmu: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[1].querySelector('b').innerText,
        share: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[2].querySelector('b').innerText,
        fans: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[3]?.querySelector('b').innerText,
      }
      : {
        comments: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[0].querySelector('b').innerText,
        danmu: 0,
        share: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[1].querySelector('b').innerText,
        fans: item.querySelector('.info-list').querySelectorAll('.data-list')[1].querySelectorAll('li')[2]?.querySelector('b').innerText,
      },
  }
}

function export_xlsx (tempData) {
  // 将数据转换为 worksheet 对象
  const worksheet = XLSX.utils.aoa_to_sheet(tempData);
  // 将 worksheet 对象添加到 workbook 中
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  // 导出 Excel 文件
  XLSX.writeFile(workbook, 'data.xlsx');
}
