chrome.runtime.onInstalled.addListener(function() {
  let ret = {}

  chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
      const urlPattern = "https://creator.xiaohongshu.com/api/galaxy/creator/data/note_stats/new";

      if (details.url.startsWith(urlPattern)) {
        // 查找并保存动态请求头的值
        for (let header of details.requestHeaders) {
          ret[header.name] = header.value
        }
        // 返回修改后的请求头
        return { requestHeaders: details.requestHeaders };
      }
    },
    { urls: ["https://creator.xiaohongshu.com/*"] },
    ["requestHeaders"]
  );

  chrome.webRequest.onCompleted.addListener(
    function(details) {
      const urlPattern = "https://creator.xiaohongshu.com/api/galaxy/creator/data/note_stats/new";

      if (details.url.startsWith(urlPattern)) {
        // if (!processedRequests.has(details.url)) {
        //   processedRequests.add(details.url); // 标记为已处理

        //   fetch(details.url, {
        //     headers: ret // header 获取到了，但是请求还是401，可能x-s、x-t都是一次性的原因
        //   })
        //   .then(response => response.text())
        //   .then(data => {
        //     chrome.storage.local.set({ [details.url]: JSON.stringify(data) }, function() {
        //       console.log("Data saved for URL:", details.url);
        //     });
        //   })
        //   .catch(err => {
        //     console.error("Error:", err);
        //   })
        // }

        // 向当前活动标签页的内容脚本发送消息
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs.length > 0) {
            const tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabId, { action: 'refreshDOM', details: details });
          }
        });
      }
    },
    { urls: ["https://creator.xiaohongshu.com/*"] }
  );



  // 监听来自内容脚本的消息
  // chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  //   if (request.type === 'pageData') {
  //     const pageData = request.data;
  //     console.log('Received page data from content script:', pageData);

  //     // 存储数据到 chrome.storage
  //     chrome.storage.local.set({ 'pageData': pageData }, function() {
  //       console.log('Page data saved====', pageData);
  //     });
  //   }
  // });

});