// 线索
// 当页面在笔记页时候，才开始定时计算

// 提取按钮，多页数据，不直接生成报告，而是点击按钮后再自动化生成
const start_btn_style = 'position: fixed; z-index: 9999; left: 10px; bottom: 10px; width: 100px; height: 40px; background-color: #4CAF50; color: white; cursor: pointer; border: none; font-size: 16px; border-radius: 4px; box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2),  0 6px 20px 0 rgba(0,0,0,0.19); '
const start = document.createElement('button')
start.innerText = "提取数据"
start.style = 'display: none;'
start.onclick = () => {
  // start.style = 'display: none;'
}
document.body.appendChild(start);

if (location.href === 'https://xiaohongshu.com/user/profile/') {
  start.style = start_btn_style
}

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

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('request', request)

  if (request.action === 'refreshDOM') {
    // 选择页面中指定的 DOM 元素
    const targetElement = document.querySelectorAll('#userPostedFeeds');
    console.log('targetElement', targetElement)
    // 确保元素存在
    if (targetElement) {
      let ret = []
      // targetElement.forEach(item => {
      //   const dd = get_data_from_dom(item)
      //   ret.push(Object.values(dd))
      // })
      // console.log('ret', ret.length)
      // console.log('page:', page, page_count)


    } else {
      console.log('Element not found');
    }
  }
});

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

// 添加按钮的函数
function addButton() {
    if (document.getElementById('fetchContentButton')) {
        return;
    }

    // 创建文件输入框
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'xlsxFileInput';
    fileInput.accept = '.xlsx';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    const button = document.createElement('button');
    button.id = 'fetchContentButton';
    button.textContent = '上传并匹配数据';
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 10px 20px;
        background-color: #fe2c55;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;

    button.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // 移除第一行
            jsonData = jsonData.slice(1);

            // 处理第二列的日期格式
            jsonData.forEach(row => {
                if (row[1]) {
                    const dateMatch = row[1].match(/(\d{4})年(\d{2})月(\d{2})日/);
                    if (dateMatch) {
                        row[1] = `${dateMatch[1]}年${dateMatch[2]}月${dateMatch[3]}日`;
                    }
                }
            });

            // 获取所有笔记元素
            const feedsElement = document.getElementById('userPostedFeeds');
            if (!feedsElement) {
                alert('未找到内容元素');
                return;
            }

            // 获取所有笔记项
            const noteItems = feedsElement.querySelectorAll('.note-item');

            // 处理每一行数据
            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];
                const titleToMatch = row[0]; // 第一列作为标题匹配

                // 查找匹配的笔记
                for (const noteItem of noteItems) {
                    const titleElement = noteItem.querySelector('.title');
                    if (titleElement && titleElement.textContent.trim() === titleToMatch) {
                        const coverElement = noteItem.querySelector('.cover');
                        if (coverElement) {
                            const href = coverElement.href;
                            row.push(href);
                            break;
                        }
                    }
                }
            }

            // 只保留需要的列（1，2，4，5，7，12列）并创建新的数据数组
            const filteredData = jsonData.map(row => [
                row[0],  // 第1列
                row[1],  // 第2列
                row[3],  // 第4列
                row[4],  // 第5列
                row[6],  // 第7列
                row[11]  // 第12列（新添加的链接）
            ]);

            // 导出新的 Excel 文件
            const newWorkbook = XLSX.utils.book_new();
            const newWorksheet = XLSX.utils.aoa_to_sheet(filteredData);

            // 设置单元格样式
            const range = XLSX.utils.decode_range(newWorksheet['!ref']);
            for (let R = range.s.r; R <= range.e.r; R++) {
                for (let C = range.s.c; C <= range.e.c; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!newWorksheet[cellAddress]) continue;
                    newWorksheet[cellAddress].s = {
                        alignment: {
                            horizontal: 'center',
                            vertical: 'center'
                        }
                    };
                }
            }

            // 计算并设置列宽
            const colWidths = getMaxWidths(filteredData);
            newWorksheet['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Sheet1');
            XLSX.writeFile(newWorkbook, '匹配结果.xlsx');
        };
        reader.readAsArrayBuffer(file);
    });

    document.body.appendChild(button);
}

// 修改URL检查逻辑
function checkUrlAndAddButton() {
    console.log('检查URL:', window.location.href); // 添加调试日志
    if (window.location.href.includes('/user/profile/')) {
        console.log('匹配到用户主页，添加按钮'); // 添加调试日志
        addButton();
    }
}

// 立即执行一次检查
checkUrlAndAddButton();

// 使用 MutationObserver 监听 URL 变化
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        console.log('URL changed to:', currentUrl); // 添加调试日志
        lastUrl = currentUrl;
        checkUrlAndAddButton();
    }
});

// 开始观察
observer.observe(document, { subtree: true, childList: true });

// 添加额外的事件监听
window.addEventListener('load', checkUrlAndAddButton);
window.addEventListener('popstate', checkUrlAndAddButton);
window.addEventListener('pushstate', checkUrlAndAddButton);
window.addEventListener('replacestate', checkUrlAndAddButton);
