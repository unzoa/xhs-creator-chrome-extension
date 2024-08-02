# xhs-creator-chrome-extension

> 通过浏览器扩展方式，获取个人账户后台页面创作数据，导出为csv文件

## 坑

导入插件，页面获取数据没问题
但是，过一段时间后，chrome的API都会被卸载，需要更新插件，并且刷新网页
包含了chrome.alamer定时页不起作用

**background.js加入了setinterval后好使**
