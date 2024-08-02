setInterval(() => {
  console.log('keeplive serviceworker......')
}, 1000);

chrome.webRequest.onCompleted.addListener(
  function (details) {
    const urlPattern = "https://creator.xiaohongshu.com/api/galaxy/creator/data/note_stats/new";

    console.log('222 url:', details.url)

    if (details.url.startsWith(urlPattern)) {
      // 向当前活动标签页的内容脚本发送消息
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        console.log('has receive data')
        if (tabs.length === 0) {
          console.error('No active tabs found.');
          return;
        }

        if (tabs.length > 0) {
          const tabId = tabs[0].id;
          chrome.tabs.sendMessage(tabId, { action: 'refreshDOM', details: details }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error sending message:', chrome.runtime.lastError.message);
            } else {
              console.log('Response from content script:', response);
            }
          });
        }
      });
    }
  },
  { urls: ["https://creator.xiaohongshu.com/*"] }
);