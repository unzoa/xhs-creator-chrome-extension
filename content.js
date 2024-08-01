console.log(1111)

let finnal = [
  ['标题', '发布时间', '观看量', '人均观看时长', '点赞量', '收藏量', '评论量', '弹幕数', '分享量', '直接涨粉数', '观赞比', '观藏比', '观评比']
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

function reset() {
  finnal = [
    ['标题', '发布时间', '观看量', '人均观看时长', '点赞量',
    '收藏量', '评论量', '弹幕数', '分享量', '直接涨粉数',
    '观赞比', '观藏比', '观评比']
  ]
  page = 1
  can_next = false
  handle = false
  start.style = start_btn_style
}
// “提取数据”按钮显示判断
window.addEventListener('popstate', function (event) {
  if (location.pathname === '/creator/notes') {
    start.style = start_btn_style
  } else {
    reset()
    start.style = 'display: none;'
  }
});



// 触发下一页操作
function next_page() {
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
  console.log(1111, page, page_count, request)

  if (request.type === "networkRequest") {
    trans_api_data(request)
  }

  // if (request.action === 'refreshDOM') { trans_dom_data() }
})

function trans_dom_data () {
  // 选择页面中指定的 DOM 元素
  const targetElement = document.querySelectorAll('.note-card-container');

  // 确保元素存在
  if (targetElement) {
    let ret = []
    targetElement.forEach(item => {
      const dd = get_data_from_dom(item)
      ret.push(Object.values(dd))
    })

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
};

function trans_api_data (request) {
  console.log("Received network request data in content script");
  // 在这里处理接收到的数据
  const data = JSON.parse(request.content).data.note_infos

  const ret = data.map((item, ind) => {
    const {
      title, post_time, // 时间戳
      read, view_time_avg, // 人均观看量
      like, fav, comment, danmaku_count, // 弹幕
      share, follow
    } = item
    return [
      title, formatTimestamp(post_time), // 时间戳
      read, view_time_avg, // 人均观看量
      like, fav, comment, danmaku_count, // 弹幕
      share, follow,

      per2(like, read),
      per2(fav, read),
      per2(comment, read)
    ]
  })


  // 当页面只有1页时候，只生成一次，不再刷新页面
  if (page_count === 1) {
    finnal = finnal.concat(ret)
    return
  }

  console.log('ret length: ', ret.length, 'finnal length: ', finnal.length)

  // 当页面数量大于1页
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
function get_data_from_dom(item) {
  const info_text = item.querySelector('.info-text')
  const data_list = item.querySelector('.info-list').querySelectorAll('.data-list')

  const data_list_left_lis = data_list[0].querySelectorAll('li')
  const data_list_right_lis = data_list[1].querySelectorAll('li')

  let [watch, view_long, like, collect, comments, danmu, share, fans] = [0, 0, 0, 0, 0, 0, 0, 0]
  if (data_list_left_lis.length === 4) {
    watch = data_list_left_lis[0].querySelector('b').innerText
    view_long = data_list_left_lis[1].querySelector('b').innerText
    like = data_list_left_lis[2].querySelector('b').innerText
    collect = data_list_left_lis[3]?.querySelector('b').innerText || 0
  } else {
    watch = data_list_left_lis[0].querySelector('b').innerText
    like = data_list_left_lis[1].querySelector('b').innerText
    collect = data_list_left_lis[2]?.querySelector('b').innerText || 0
  }

  if (data_list_right_lis.length === 4) {
    comments = data_list_right_lis[0].querySelector('b').innerText
    danmu = data_list_right_lis[1].querySelector('b').innerText
    share = data_list_right_lis[2].querySelector('b').innerText
    fans = data_list_right_lis[3]?.querySelector('b').innerText || 0
  } else {
    comments = data_list_right_lis[0].querySelector('b').innerText
    share = data_list_right_lis[1].querySelector('b').innerText
    fans = data_list_right_lis[2]?.querySelector('b').innerText || 0
  }

  return {
    title: info_text.querySelector('.title').innerText,
    publish_time: info_text.querySelector('.publish-time').innerText.replace('发布于 ', ''),
    watch, view_long, like, collect, comments, danmu, share, fans,


    // '观赞比', '观藏比', '观评比'
    a: per(like, watch),
    b: per(collect, watch),
    c: per(comments, watch)
  }
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // 格式化为 YYYY-MM-DD HH:MM:SS
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  return formattedDate;
}

function per2 (str1, str2) {
  if (str2 == 0) {
    return 0
  }

  return str1 / str2
}

function per(str1, str2) {
  if (str2 == 0) {
    return 0
  }

  return math_text(str1) / math_text(str2)
}
// str 中有汉字，需要计算成数字
function math_text(str) {
  if (str.includes('万')) {
    str = str.replace('万', '')
    str = str * 10000
  }
  return str * 1
}

function export_xlsx(tempData) {
  // 将数据转换为 worksheet 对象
  const worksheet = XLSX.utils.aoa_to_sheet(tempData);

  // 计算字符串宽度的辅助函数
  const getStringWidth = (str) => {
    let width = 0;
    for (const char of str) {
      if (char.match(/[^\x00-\xff]/)) {
        width += 2; // 汉字和全角字符
      } else {
        width += 1; // 英文字符和半角字符
      }
    }
    return width;
  };

  // 设置单元格样式，使内容居中
  for (let rowIndex = 0; rowIndex < tempData.length; rowIndex++) {
    for (let colIndex = 0; colIndex < tempData[rowIndex].length; colIndex++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
            alignment: {
                horizontal: 'center',
                vertical: 'center'
            }
        };
    }
  }

  // 计算每列的最大宽度
  const getMaxWidths = (data) => {
    const colWidths = new Array(data[0].length).fill(0);

    data.forEach(row => {
      row.forEach((cell, colIndex) => {
        const cellValue = cell !== undefined && cell !== null ? cell.toString() : "";
        const cellWidth = getStringWidth(cellValue);
        if (cellWidth > colWidths[colIndex]) {
          colWidths[colIndex] = cellWidth;
        }
      });
    });

    return colWidths.map(width => ({ wch: width }));
  };

  // 获取每列的最大宽度
  const colWidths = getMaxWidths(tempData);

  // 设置列宽
  worksheet['!cols'] = colWidths;

  // 将 worksheet 对象添加到 workbook 中
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  // 导出 Excel 文件
  XLSX.writeFile(workbook, 'data.xlsx');
}
