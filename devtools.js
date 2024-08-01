console.log(333)
chrome.devtools.panels.create("Network Listener", "", "panel.html", function(panel) {
  // 面板创建后执行的回调
});

chrome.devtools.network.onRequestFinished.addListener(function(request) {
  // 监听网络请求完成事件
  request.getContent(function(content, encoding) {
      const urlPattern = "https://creator.xiaohongshu.com/api/galaxy/creator/data/note_stats/new";

      if (request.request.url.startsWith(urlPattern)) {
        console.log('dev data', content)

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "networkRequest",
            content: content
          });
        });
        // 发送消息到背景脚本
        // chrome.runtime.sendMessage({
        //   type: "networkRequest",
        //   content: content
        // });
      }
  });
});
