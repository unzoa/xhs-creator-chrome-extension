document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get('pageData', function(items) {
    const dataList = document.getElementById('dataList');
    for (let url in items) {
      let listItem = document.createElement('li');
      listItem.textContent = `${url}: ${items[url]}`;
      dataList.appendChild(listItem);
    }
  });
});
