chrome.runtime.onInstalled.addListener(function() {
  let ret = {}
  console.log('ret', 12121)
  chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
      const urlPattern = "https://xiaohongshu.com/user/profile/";

      if (details.url.startsWith(urlPattern)) {
        // 查找并保存动态请求头的值
        for (let header of details.requestHeaders) {
          ret[header.name] = header.value
        }
        // 返回修改后的请求头
        return { requestHeaders: details.requestHeaders };
      }
    },
    { urls: ["https://xiaohongshu.com/*"] },
    ["requestHeaders"]
  );

  chrome.webRequest.onCompleted.addListener(
    function(details) {
      const urlPattern = "https://xiaohongshu.com/user/profile/";

      if (details.url.startsWith(urlPattern)) {
        // 向当前活动标签页的内容脚本发送消息
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs.length > 0) {
            const tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabId, { action: 'refreshDOM', details: details });
          }
        });
      }
    },
    { urls: ["https://xiaohongshu.com/*"] }
  );
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FEEDS_CONTENT') {
        console.log('获取到的内容:', message.content);
        // 这里可以添加处理内容的逻辑
    }
});