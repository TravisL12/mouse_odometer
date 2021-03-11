window.addEventListener('load', function load() {
  chrome.tabs.executeScript({
    file: './js/app.js',
  });
});

// const script = document.createElement('script');
// script.src = chrome.extension.getURL('./js/app.js');
// (document.head || document.documentElement).appendChild(script);
